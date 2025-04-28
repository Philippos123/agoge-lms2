export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
      extend: {
        typography: {
          DEFAULT: {
            css: {
              img: {
                borderRadius: '0.5rem',
                marginTop: '1rem',
                marginBottom: '1rem',
              },
            },
          },
        },
      },
      },
      plugins: [
          require('@tailwindcss/typography'),
      ],
  };
    