package handler

import (
	"strconv"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
)

func toText(s string) pgtype.Text {
	if s == "" {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: s, Valid: true}
}

func toTextPtr(s *string) pgtype.Text {
	if s == nil || *s == "" {
		return pgtype.Text{Valid: false}
	}
	return pgtype.Text{String: *s, Valid: true}
}

func toInt8(i int64) pgtype.Int8 {
	if i == 0 {
		return pgtype.Int8{Valid: false}
	}
	return pgtype.Int8{Int64: i, Valid: true}
}

func toInt8Ptr(i *int64) pgtype.Int8 {
	if i == nil || *i == 0 {
		return pgtype.Int8{Valid: false}
	}
	return pgtype.Int8{Int64: *i, Valid: true}
}

func toInt4(i int) pgtype.Int4 {
	if i == 0 {
		return pgtype.Int4{Valid: false}
	}
	return pgtype.Int4{Int32: int32(i), Valid: true}
}

func toInt4Ptr(i *int) pgtype.Int4 {
	if i == nil || *i == 0 {
		return pgtype.Int4{Valid: false}
	}
	return pgtype.Int4{Int32: int32(*i), Valid: true}
}

func toNumeric(f float64) pgtype.Numeric {
	var num pgtype.Numeric
	_ = num.Scan(strconv.FormatFloat(f, 'f', 2, 64))
	return num
}

func toNumericStr(s string) pgtype.Numeric {
	var num pgtype.Numeric
	_ = num.Scan(s)
	return num
}

func toDate(d string) pgtype.Date {
	if d == "" {
		return pgtype.Date{Valid: false}
	}
	t, err := time.Parse("2006-01-02", d)
	if err != nil {
		return pgtype.Date{Valid: false}
	}
	return pgtype.Date{Time: t, Valid: true}
}

func toTimestamptz(t time.Time) pgtype.Timestamptz {
	if t.IsZero() {
		return pgtype.Timestamptz{Valid: false}
	}
	return pgtype.Timestamptz{Time: t, Valid: true}
}

func textVal(t pgtype.Text) string {
	if t.Valid {
		return t.String
	}
	return ""
}

func int8Val(i pgtype.Int8) int64 {
	if i.Valid {
		return i.Int64
	}
	return 0
}

func numericVal(n pgtype.Numeric) float64 {
	if !n.Valid {
		return 0
	}
	f, _ := n.Float64Value()
	if f.Valid {
		return f.Float64
	}
	return 0
}

