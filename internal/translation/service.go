package translation

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"

	"optical-shop/db/pgdb"
)

type TranslationService struct {
	db             pgdb.Querier
	libreURL       string
	httpClient     *http.Client
	memCache       sync.Map // key: "sourceLang:targetLang:sourceText" -> val: "translatedText"
}

func NewTranslationService(db pgdb.Querier, libreURL string) *TranslationService {
	return &TranslationService{
		db:       db,
		libreURL: strings.TrimRight(libreURL, "/"),
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

type LibreTranslateRequest struct {
	Q      string `json:"q"`
	Source string `json:"source"`
	Target string `json:"target"`
	Format string `json:"format"`
}

type LibreTranslateBatchRequest struct {
	Q      []string `json:"q"`
	Source string   `json:"source"`
	Target string   `json:"target"`
	Format string   `json:"format"`
}

type LibreTranslateResponse struct {
	TranslatedText string `json:"translatedText"`
	Error          string `json:"error,omitempty"`
}

// Translate translates a single string with caching & fallback
func (s *TranslationService) Translate(ctx context.Context, sourceText, sourceLang, targetLang string) string {
	if sourceText == "" || sourceLang == targetLang {
		return sourceText
	}

	cacheKey := fmt.Sprintf("%s:%s:%s", sourceLang, targetLang, sourceText)

	// 1. Check in-memory cache
	if val, ok := s.memCache.Load(cacheKey); ok {
		if str, ok := val.(string); ok && str != "" {
			return str
		}
	}

	// 2. Check PostgreSQL database cache
	if s.db != nil {
		cached, err := s.db.GetTranslation(ctx, pgdb.GetTranslationParams{
			SourceLang: sourceLang,
			TargetLang: targetLang,
			SourceText: sourceText,
		})
		if err == nil && cached.TranslatedText != "" {
			s.memCache.Store(cacheKey, cached.TranslatedText)
			return cached.TranslatedText
		}
	}

	// 3. Call translation provider (LibreTranslate)
	translated, err := s.callLibreTranslate(ctx, sourceText, sourceLang, targetLang)
	if err != nil || translated == "" {
		// Fallback to original text on failure
		return sourceText
	}

	// 4. Save into in-memory cache & database cache
	s.memCache.Store(cacheKey, translated)
	if s.db != nil {
		_, _ = s.db.UpsertTranslation(ctx, pgdb.UpsertTranslationParams{
			SourceText:     sourceText,
			SourceLang:     sourceLang,
			TargetLang:     targetLang,
			TranslatedText: translated,
		})
	}

	return translated
}

// TranslateBatch translates a slice of strings in bulk efficiently
func (s *TranslationService) TranslateBatch(ctx context.Context, texts []string, sourceLang, targetLang string) map[string]string {
	result := make(map[string]string, len(texts))
	if len(texts) == 0 {
		return result
	}
	if sourceLang == targetLang {
		for _, text := range texts {
			result[text] = text
		}
		return result
	}

	var missingFromMem []string

	// 1. Check in-memory cache first
	for _, text := range texts {
		if text == "" {
			result[text] = ""
			continue
		}
		cacheKey := fmt.Sprintf("%s:%s:%s", sourceLang, targetLang, text)
		if val, ok := s.memCache.Load(cacheKey); ok {
			if str, ok := val.(string); ok && str != "" {
				result[text] = str
				continue
			}
		}
		missingFromMem = append(missingFromMem, text)
	}

	if len(missingFromMem) == 0 {
		return result
	}

	// 2. Check PostgreSQL translation_cache table for missing strings
	var missingFromDB []string
	if s.db != nil {
		dbTranslations, err := s.db.GetBatchTranslations(ctx, pgdb.GetBatchTranslationsParams{
			SourceLang:  sourceLang,
			TargetLang:  targetLang,
			SourceTexts: missingFromMem,
		})
		if err == nil {
			dbFound := make(map[string]string)
			for _, item := range dbTranslations {
				dbFound[item.SourceText] = item.TranslatedText
				result[item.SourceText] = item.TranslatedText
				cacheKey := fmt.Sprintf("%s:%s:%s", sourceLang, targetLang, item.SourceText)
				s.memCache.Store(cacheKey, item.TranslatedText)
			}
			for _, text := range missingFromMem {
				if _, ok := dbFound[text]; !ok {
					missingFromDB = append(missingFromDB, text)
				}
			}
		} else {
			missingFromDB = missingFromMem
		}
	} else {
		missingFromDB = missingFromMem
	}

	if len(missingFromDB) == 0 {
		return result
	}

	// 3. Call translation provider for any remaining missing strings
	for _, text := range missingFromDB {
		translated, err := s.callLibreTranslate(ctx, text, sourceLang, targetLang)
		if err != nil || translated == "" {
			// Fallback to original text
			result[text] = text
		} else {
			result[text] = translated
			cacheKey := fmt.Sprintf("%s:%s:%s", sourceLang, targetLang, text)
			s.memCache.Store(cacheKey, translated)

			if s.db != nil {
				_, _ = s.db.UpsertTranslation(ctx, pgdb.UpsertTranslationParams{
					SourceText:     text,
					SourceLang:     sourceLang,
					TargetLang:     targetLang,
					TranslatedText: translated,
				})
			}
		}
	}

	return result
}

func (s *TranslationService) callLibreTranslate(ctx context.Context, text, source, target string) (string, error) {
	if s.libreURL == "" {
		return text, nil
	}

	reqBody, err := json.Marshal(LibreTranslateRequest{
		Q:      text,
		Source: source,
		Target: target,
		Format: "text",
	})
	if err != nil {
		return "", err
	}

	url := fmt.Sprintf("%s/translate", s.libreURL)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(reqBody))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		log.Printf("LibreTranslate request error for '%s': %v", text, err)
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("LibreTranslate returned status %d: %s", resp.StatusCode, string(body))
	}

	var res LibreTranslateResponse
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return "", err
	}

	if res.Error != "" {
		return "", fmt.Errorf("translation error: %s", res.Error)
	}

	return res.TranslatedText, nil
}
