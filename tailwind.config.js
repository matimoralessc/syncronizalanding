/** @type {import('tailwindcss').Config} */

// Landing oscura de Syncroniza.
//
// El fondo y las superficies salen de la paleta cerrada de la skill de landing
// (#000, #181818, #1F1F1F, #272727, #313131): el 4D es el protagonista y el
// negro puro es lo único que no compite con sus colores. Los videos se graban
// con el fondo del visor en #000 para fundirse con la página sin borde.
//
// Los azules son los del isotipo (muestreados pixel a pixel en la versión
// anterior) y los colores de ciclo son los MISMOS que pinta el visor 4D
// (gantt.ts / ciclos.ts): un chip rojo en la página es el ciclo rojo del video.
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        negro: "#000000",
        carbon: "#181818",
        grafito: "#1F1F1F",
        humo: "#272727",
        ceniza: "#313131",
        texto: {
          DEFAULT: "#FFFFFF",
          2: "#C8C8C8",
          3: "#9B9B9B",
          4: "#6E6E6E",
        },
        iso: {
          navy: "#20366F",
          mid: "#0C699D",
          sky: "#37B6FF",
        },
        ciclo: {
          rojo: "#E53E3E",
          amarillo: "#ECC94B",
          azul: "#4299E1",
          verde: "#48BB78",
          naranjo: "#ED8936",
          morado: "#9F7AEA",
          rosado: "#F687B3",
          turquesa: "#81E6D9",
        },
      },
      fontFamily: {
        sans: ['"Geist Variable"', "system-ui", "sans-serif"],
        mono: ['"Geist Mono Variable"', "ui-monospace", "monospace"],
      },
      transitionTimingFunction: {
        // La curva de la skill: masa y resorte, no la ease de fábrica.
        fluido: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      transitionDuration: {
        800: "800ms",
        900: "900ms",
        1200: "1200ms",
      },
    },
  },
  plugins: [],
};
