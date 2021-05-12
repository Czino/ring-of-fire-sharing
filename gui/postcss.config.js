const purgecss = require('@fullhuman/postcss-purgecss')

module.exports = {
  plugins: [
    'tailwindcss',
    purgecss({
      preserveHtmlElements: false,
      content: [
        './dist/**/*.html',
        './dist/**/*.js',
      ],
      safelist: [
        /\//,
      ]
    })
  ]
}
