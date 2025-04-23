// tailwind.config.js
module.exports = {
    content: [
      // paths to your template files
      './*.html',
      './templates/**/*.html',
      // etc.
    ],
    theme: {
      extend: {},
    },
    plugins: [
      require('daisyui'), // <-- Make sure this line is present
    ],
    // Optional: DaisyUI configuration
    daisyui: {
      themes: ["light", "dark"], // example themes
    },
  }
