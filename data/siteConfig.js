const config = {
  author: "IU6FZL",
  authorName: "Andrea Salvatori",
  siteTitle: "Andrea Salvatori - Sonic0", // Site title.
  siteTitleShort: "Sonic0", // Short site title for homescreen (PWA). Preferably should be under 12 characters to prevent truncation.
  siteTitleAlt: "Sonic0", // Alternative site title for SEO.
  // siteLogo: "/images/avatar.png", // Logo used for SEO and manifest.
  siteUrl: "https://andreasalvatori.dev", // Domain of your website without pathPrefix.
  pathPrefix: "", // Prefixes all links. For cases when deployed to example.github.io/gatsby-advanced-starter/.
  siteDescription:
    "The personal site of a very cute person called Andrea Salvatori ᕕ( ᐛ )ᕗ", // Website description used for meta description tag.
  // siteFBAppID: "", // FB Application ID for using app insights
  userTwitter: "IU6FZL", // Optionally renders "Follow Me" in the UserInfo segment.
  userLocation: "Italy", // User location to display in the author segment.
  userAvatar: "src/images/avatar.png", // User avatar to display in the author segment.
  userDescription: "DevOps, Linux and Open Source enthusiast, Radio-ham", // User description to display in the author segment.
  // Links to social profiles/projects you want to display in the author segment/navigation bar.
  userLinks: [
    // useful for some social plugins
    {
      label: "KeyBase",
      url: "https://keybase.io/sonic0",
      iconClassName: "fab fa-4x fa-keybase",
    },
    {
      label: "GitHub",
      url: "https://github.com/Sonic0",
      iconClassName: "fab fa-4x fa-github",
    },
    {
      // FontAwesome has no AniList icon, so this one is sourced separately
      // from Simple Icons (https://simpleicons.org/?q=anilist) instead of
      // a fa-* class. `iconSvgPath` is drawn on a 0 0 24 24 viewBox.
      label: "AniList.co",
      url: "https://anilist.co/user/Sonic0/animelist",
      iconSvgPath:
        "M24 17.53v2.421c0 .71-.391 1.101-1.1 1.101h-5l-.057-.165L11.84 3.736c.106-.502.46-.788 1.053-.788h2.422c.71 0 1.1.391 1.1 1.1v12.38H22.9c.71 0 1.1.392 1.1 1.101zM11.034 2.947l6.337 18.104h-4.918l-1.052-3.131H6.019l-1.077 3.131H0L6.361 2.948h4.673zm-.66 10.96-1.69-5.014-1.541 5.015h3.23z",
    },
    {
      label: "Notes",
      url: "https://notes.andreasalvatori.dev",
      iconClassName: "fas fa-4x fa-clipboard",
    },
    {
      label: "Twitter",
      url: "https://twitter.com/IU6FZL",
      iconClassName: "fab fa-4x fa-twitter",
    },
    {
      label: "Linkedin",
      url: "https://www.linkedin.com/in/andrea-salvatori-432929166/",
      iconClassName: "fab fa-4x fa-linkedin-in",
    },
  ],
  themeColor: "#A449FF", // Used for setting manifest and progress theme colors.
  backgroundColor: "#fff", // Used for setting manifest background color.
};

// --- Validate ---

// Make sure pathPrefix is empty if not needed
if (config.pathPrefix === "/") {
  config.pathPrefix = "";
} else {
  // Make sure pathPrefix only contains the first forward slash
  config.pathPrefix = `/${config.pathPrefix.replace(/^\/|\/$/g, "")}`;
}

// Make sure siteUrl doesn't have an ending forward slash
if (config.siteUrl.substr(-1) === "/")
  config.siteUrl = config.siteUrl.slice(0, -1);

module.exports = config;
