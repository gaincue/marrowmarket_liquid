module.exports = {
  prefix: "twcss-",
  content: [
    "./layout/*.liquid",
    "./templates/*.liquid",
    "./templates/customers/*.liquid",
    "./sections/*.liquid",
    "./snippets/*.liquid",
  ],
  theme: {
    colors: {
      flesh: "#ab121c",
      skin: "#fcfaed",
      bone: "#ffffff",
      charcoal: "#242424",
      mud: "#ac7948",
    },
    screens: {
      sm: "320px",
      md: "750px",
      lg: "990px",
      xlg: "1440px",
      x2lg: "1920px",
      pageMaxWidth: "1440px",
    },
    extend: {
      fontFamily: {
        heading: "var(--font-heading-family)",
      },
    },
  },
  plugins: [],
};
