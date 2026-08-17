const config = require("./data/siteConfig");

module.exports = {
  siteMetadata: {
    title: config.siteTitle,
    shortName: config.siteTitleShort,
    description: config.siteDescription,
    author: config.author,
    authorName: config.authorName,
    authorDescription: config.userDescription,
    siteUrl: config.siteUrl,
    userLinks: config.userLinks,
  },
  plugins: [
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    `gatsby-plugin-image`,
    `gatsby-plugin-sharp`,
    `gatsby-transformer-sharp`,
    {
      resolve: `gatsby-plugin-sass`,
      options: {
        sassOptions: {
          // gatsby-plugin-sass still calls Dart Sass's legacy render() API,
          // and Bulma's own bundled Sass uses the deprecated if() syntax.
          // Neither is something this project can fix directly, so silence
          // just those two known, non-actionable deprecation warnings.
          quietDeps: true,
          silenceDeprecations: [`legacy-js-api`],
        },
      },
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: config.siteTitle,
        short_name: config.siteTitleShort,
        description: config.siteDescription,
        start_url: config.pathPrefix,
        background_color: config.backgroundColor,
        theme_color: config.themeColor,
        display: `minimal-ui`,
        icon: config.userAvatar, // This path is relative to the root of the site.
      },
    },
  ],
};
