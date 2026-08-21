package optical

import (
	"math"
)

type TransposeRequest struct {
	Sph  float64 `json:"sph"`
	Cyl  float64 `json:"cyl"`
	Axis int     `json:"axis"`
}

type TransposeResult struct {
	Sph  float64 `json:"sph"`
	Cyl  float64 `json:"cyl"`
	Axis int     `json:"axis"`
}

type CLConvertRequest struct {
	Sph            float64 `json:"sph"`
	Cyl            float64 `json:"cyl"`
	Axis           int     `json:"axis"`
	VertexDistance float64 `json:"vertex_distance"` // in mm, default 12
}

type CLConvertResult struct {
	CLSph               float64 `json:"cl_sph"`
	CLCyl               float64 `json:"cl_cyl"`
	CLAxis              int     `json:"cl_axis"`
	SphericalEquivalent float64 `json:"spherical_equivalent"`
}

// Transpose converts a prescription between plus and minus cylinder form
func Transpose(sph, cyl float64, axis int) TransposeResult {
	if cyl == 0 {
		return TransposeResult{
			Sph:  round2(sph),
			Cyl:  0.0,
			Axis: axis,
		}
	}

	newSph := sph + cyl
	newCyl := -cyl
	newAxis := (axis + 90) % 180
	if newAxis == 0 {
		newAxis = 180
	}

	return TransposeResult{
		Sph:  round2(newSph),
		Cyl:  round2(newCyl),
		Axis: newAxis,
	}
}

// ConvertSpectacleToCL calculates contact lens power accounting for vertex distance
// Formula: Fc = Fs / (1 - d * Fs)
func ConvertSpectacleToCL(sph, cyl float64, axis int, vertexDistanceMM float64) CLConvertResult {
	if vertexDistanceMM <= 0 {
		vertexDistanceMM = 12.0 // standard 12mm
	}
	d := vertexDistanceMM / 1000.0 // convert to meters

	// Power along principal meridians
	f1 := sph
	f2 := sph + cyl

	// Adjusted powers
	fc1 := f1 / (1.0 - (d * f1))
	fc2 := f2 / (1.0 - (d * f2))

	clSph := fc1
	clCyl := fc2 - fc1
	clAxis := axis

	se := sph + (cyl / 2.0)
	clSE := se / (1.0 - (d * se))

	return CLConvertResult{
		CLSph:               round2(clSph),
		CLCyl:               round2(clCyl),
		CLAxis:              clAxis,
		SphericalEquivalent: round2(clSE),
	}
}

// SphericalEquivalent calculates SPH + (CYL / 2)
func SphericalEquivalent(sph, cyl float64) float64 {
	return round2(sph + (cyl / 2.0))
}

func round2(val float64) float64 {
	return math.Round(val*100) / 100
}
