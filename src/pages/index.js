import React from "react";
import PropTypes from "prop-types";
import { graphql } from "gatsby";
import Layout from "../components/layout";
import Seo from "../components/seo";
import About from "../components/about";

const IndexPage = ({ data }) => {
  const page = data.site.siteMetadata;
  const files = data.file;

  return (
    <Layout>
      <About
        shortName={page.shortName}
        authorName={page.authorName}
        author={page.author}
        authorDescription={page.authorDescription}
        avatar={files.childImageSharp.gatsbyImageData}
        userLinks={page.userLinks}
      />
    </Layout>
  );
};

IndexPage.propTypes = {
  data: PropTypes.shape({
    site: PropTypes.shape({
      siteMetadata: PropTypes.shape({
        title: PropTypes.string.isRequired,
        shortName: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        author: PropTypes.string.isRequired,
        authorName: PropTypes.string.isRequired,
        authorDescription: PropTypes.string.isRequired,
        userLinks: PropTypes.arrayOf(
          PropTypes.shape({
            label: PropTypes.string.isRequired,
            url: PropTypes.string.isRequired,
            iconClassName: PropTypes.string.isRequired,
          }),
        ).isRequired,
      }).isRequired,
    }).isRequired,
    file: PropTypes.object.isRequired,
  }).isRequired,
};

export default IndexPage;

export const Head = () => <Seo lang="en" title="Home" />;

export const query = graphql`
  {
    site {
      siteMetadata {
        title
        shortName
        description
        author
        authorName
        authorDescription
        userLinks {
          label
          url
          iconClassName
        }
      }
    }
    file(relativePath: { eq: "avatar.png" }) {
      childImageSharp {
        gatsbyImageData(width: 500, quality: 100, layout: CONSTRAINED)
      }
    }
  }
`;
