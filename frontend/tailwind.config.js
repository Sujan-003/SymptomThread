export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      "colors": {
        "on-surface": "#191c1e",
        "primary": "#4648d4",
        "inverse-on-surface": "#eff1f3",
        "surface-variant": "#e0e3e5",
        "tertiary-container": "#b55d00",
        "tertiary": "#904900",
        "background": "#f7f9fb",
        "inverse-surface": "#2d3133",
        "on-primary": "#ffffff",
        "on-secondary-fixed": "#0d1c2d",
        "surface-container": "#eceef0",
        "surface": "#f7f9fb",
        "on-secondary": "#ffffff",
        "primary-fixed": "#e1e0ff",
        "tertiary-fixed": "#ffdcc5",
        "primary-container": "#6063ee",
        "surface-container-highest": "#e0e3e5",
        "on-tertiary": "#ffffff",
        "on-secondary-fixed-variant": "#39485a",
        "on-error": "#ffffff",
        "surface-dim": "#d8dadc",
        "error": "#ba1a1a",
        "on-tertiary-fixed": "#301400",
        "on-secondary-container": "#556477",
        "surface-container-high": "#e6e8ea",
        "on-tertiary-container": "#fffbff",
        "primary-fixed-dim": "#c0c1ff",
        "surface-tint": "#494bd6",
        "on-primary-fixed-variant": "#2f2ebe",
        "secondary": "#516072",
        "secondary-fixed": "#d4e4fa",
        "secondary-container": "#d2e1f7",
        "inverse-primary": "#c0c1ff",
        "on-error-container": "#93000a",
        "on-tertiary-fixed-variant": "#703700",
        "on-background": "#191c1e",
        "surface-bright": "#f7f9fb",
        "on-primary-container": "#fffbff",
        "tertiary-fixed-dim": "#ffb783",
        "on-surface-variant": "#464554",
        "secondary-fixed-dim": "#b9c8de",
        "outline-variant": "#c7c4d7",
        "surface-container-lowest": "#ffffff",
        "error-container": "#ffdad6",
        "on-primary-fixed": "#07006c",
        "outline": "#767586",
        "surface-container-low": "#f2f4f6",
        "severity-low": "#d4edda",
        "on-severity-low": "#155724",
        "severity-medium": "#fff3cd",
        "on-severity-medium": "#856404",
        "severity-high": "#f8d7da",
        "on-severity-high": "#721c24"
      },
      "borderRadius": {
        "DEFAULT": "0.25rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      "spacing": {
        "gutter": "16px",
        "stack-md": "16px",
        "stack-sm": "8px",
        "stack-lg": "32px",
        "unit": "8px",
        "container-margin": "24px",
        "section-gap": "48px"
      },
      "fontFamily": {
        "body-base": ["Manrope", "sans-serif"],
        "label-caps": ["Manrope", "sans-serif"],
        "headline-md": ["Manrope", "sans-serif"],
        "display-lg": ["Manrope", "sans-serif"],
        "body-sm": ["Manrope", "sans-serif"],
        "title-sm": ["Manrope", "sans-serif"]
      },
      "fontSize": {
        "body-base": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
        "label-caps": ["12px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "700"}],
        "headline-md": ["24px", {"lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "600"}],
        "display-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
        "body-sm": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
        "title-sm": ["18px", {"lineHeight": "24px", "fontWeight": "600"}]
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ]
}
