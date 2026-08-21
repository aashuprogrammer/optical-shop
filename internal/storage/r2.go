package storage

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"optical-shop/internal/config"
)

type R2Service struct {
	client    *s3.Client
	bucket    string
	publicURL string
}

func NewR2Service(cfg *config.Config) (*R2Service, error) {
	if cfg.R2AccessKeyID == "" || cfg.R2SecretAccessKey == "" || cfg.R2Endpoint == "" {
		return &R2Service{
			bucket:    cfg.R2BucketName,
			publicURL: cfg.R2PublicURL,
		}, nil // Return local storage fallback if unconfigured
	}

	r2Resolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
		return aws.Endpoint{
			URL: cfg.R2Endpoint,
		}, nil
	})

	customCfg, err := awsconfig.LoadDefaultConfig(context.TODO(),
		awsconfig.WithEndpointResolverWithOptions(r2Resolver),
		awsconfig.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(cfg.R2AccessKeyID, cfg.R2SecretAccessKey, "")),
		awsconfig.WithRegion("auto"),
	)
	if err != nil {
		return nil, fmt.Errorf("unable to load R2 SDK config: %w", err)
	}

	client := s3.NewFromConfig(customCfg)

	return &R2Service{
		client:    client,
		bucket:    cfg.R2BucketName,
		publicURL: strings.TrimRight(cfg.R2PublicURL, "/"),
	}, nil
}

func (s *R2Service) UploadFile(ctx context.Context, fileHeader *multipart.FileHeader, category string, shopID int64) (string, string, error) {
	file, err := fileHeader.Open()
	if err != nil {
		return "", "", fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	buf := bytes.NewBuffer(nil)
	if _, err := io.Copy(buf, file); err != nil {
		return "", "", fmt.Errorf("failed to read file buffer: %w", err)
	}

	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	if ext == "" {
		ext = ".jpg"
	}
	fileName := fmt.Sprintf("%d_%d%s", time.Now().UnixNano(), shopID, ext)
	key := fmt.Sprintf("%s/%d/%s", category, shopID, fileName)

	contentType := fileHeader.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	if s.client != nil {
		_, err = s.client.PutObject(ctx, &s3.PutObjectInput{
			Bucket:      aws.String(s.bucket),
			Key:         aws.String(key),
			Body:        bytes.NewReader(buf.Bytes()),
			ContentType: aws.String(contentType),
		})
		if err != nil {
			return "", "", fmt.Errorf("failed to upload object to R2: %w", err)
		}
	} else {
		// Save locally on disk when R2 is not configured
		targetPath := filepath.Join(".", "uploads", filepath.FromSlash(key))
		if err := os.MkdirAll(filepath.Dir(targetPath), 0755); err != nil {
			return "", "", fmt.Errorf("failed to create upload directory: %w", err)
		}
		if err := os.WriteFile(targetPath, buf.Bytes(), 0644); err != nil {
			return "", "", fmt.Errorf("failed to save local file: %w", err)
		}
	}

	publicURL := fmt.Sprintf("%s/%s", s.publicURL, key)
	if s.publicURL == "" {
		publicURL = fmt.Sprintf("/uploads/%s", key)
	}

	return publicURL, key, nil
}
