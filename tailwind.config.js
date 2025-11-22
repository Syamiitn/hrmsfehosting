export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                theme: {
                    violet: "#4C1D95",
                    blue: "#024896",
                    rose: "#9e2a13",
                    green: "#14af33",
                    orange: "#dc8119",
                },
                grayCustom: {
                    100: "#f8f9fa",
                    200: "#e9ecef",
                    300: "#dee2e6",
                    400: "#ced4da",
                    500: "#adb5bd",
                    600: "#6c757d",
                    700: "#495057",
                    800: "#343a40",
                    900: "#212529",
                },
                primary: "var(--theme)", // dynamic theme shortcut
            },
            fontFamily: {
                inter: ["Inter", "sans-serif"],
            },
            fontSize: {
                h1: ["30px", { lineHeight: "1.3", fontWeight: "500" }],
                h2: ["25px", { lineHeight: "1.3", fontWeight: "500" }],
                h3: ["23px", { lineHeight: "1.3", fontWeight: "500" }],
                h4: ["20px", { lineHeight: "1.4", fontWeight: "500" }],
                h5: ["17px", { lineHeight: "1.4", fontWeight: "500" }],
                h6: ["14px", { lineHeight: "1.4", fontWeight: "500" }],
                p1: ["25px", { lineHeight: "1.5", fontWeight: "400" }],
                p2: ["20px", { lineHeight: "1.5", fontWeight: "400" }],
                p3: ["15px", { lineHeight: "1.5", fontWeight: "400" }],
                p4: ["10px", { lineHeight: "1.5", fontWeight: "400" }],
            },
            borderRadius: {
                none: "0px",
                sm: "4px",
                md: "8px",
                lg: "12px",
                xl: "16px",
                full: "9999px",
            },
            keyframes: {
                shimmer: {
                    "0%": { backgroundPosition: "-200% 0" },
                    "100%": { backgroundPosition: "200% 0" },
                },
            },
            animation: {
                shimmer: "shimmer 1.5s infinite linear",
            },
        },
    },
    plugins: [],
}
