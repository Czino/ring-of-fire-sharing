const purgecss = require('@fullhuman/postcss-purgecss')

module.exports = {
  plugins: [
    'tailwindcss',
    purgecss({
      preserveHtmlElements: false,
      content: [
        './src/**/*.html',
        './src/**/*.js',
      ],
      defaultExtractor: content => {
        // Capture as liberally as possible, including things like `h-(screen-1.5)`
        const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || []
        const broadMatchesWithoutTrailingSlash = broadMatches.map(match => match.replace(/\/$/, ''))

        // Capture classes within other delimiters like .block(class="w-1/2") in Pug
        const innerMatches = content.match(/[^<>"'`\s.(){}[\]#=%]*[^<>"'`\s.(){}[\]#=%:]/g) || []

        return broadMatches
          .concat(broadMatchesWithoutTrailingSlash)
          .concat(innerMatches)
      }
    })
  ]
}
