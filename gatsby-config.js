const config = require("./data/siteConfig")

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
    `gatsby-plugin-react-helmet`,
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
    `gatsby-plugin-sass`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: config.siteTitle,
        short_name: config.shortName,
        description: config.siteDescription,
        start_url: config.pathPrefix,
        background_color: config.backgroundColor,
        theme_color: config.themeColor,
        display: `minimal-ui`,
        icon: config.userAvatar, // This path is relative to the root of the site.
      },
    }
  ],
  flags: {
    DEV_SSR: true,
    PRESERVE_WEBPACK_CACHE: false,
    PRESERVE_FILE_DOWNLOAD_CACHE: false,
    PARALLEL_SOURCING: true,
  },
}
