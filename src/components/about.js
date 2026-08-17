import React from "react";
import PropTypes from "prop-types";
import { GatsbyImage } from "gatsby-plugin-image";
import NickName from "./nickname";
import SocialLinks from "./socialLinks";

const About = ({
  shortName,
  authorName,
  author,
  authorDescription,
  avatar,
  userLinks,
}) => {
  return (
    <section className="about has-background-white">
      {/* Intro section  */}
      <div className="box-flex">
        <div
          style={{
            width: "35vh",
            borderStyle: "dotted",
            borderWidth: "5px",
            borderRadius: "50%",
            padding: "15px",
            marginTop: "10px",
          }}
        >
          {/* The avatar image using gatsby image plugin*/}
          <GatsbyImage
            image={avatar}
            style={{ borderRadius: "40%" }}
            alt="Sonic0 unicorn avatar"
          />
        </div>

        <div className="is-size-2 is-size-5-touch has-text-centered mt-5">
          <NickName
            nickName={shortName}
            authorName={authorName}
            author={author}
          />
        </div>

        <div className="is-size-3 is-size-5-touch has-text-centered">
          <span>{authorDescription}</span>
        </div>

        {/* List of social icons flex */}
        <div>
          <SocialLinks userLinks={userLinks} />
        </div>
      </div>
    </section>
  );
};

About.propTypes = {
  shortName: PropTypes.string.isRequired,
  authorName: PropTypes.string.isRequired,
  author: PropTypes.string.isRequired,
  authorDescription: PropTypes.string.isRequired,
  avatar: PropTypes.object.isRequired,
  userLinks: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
      iconClassName: PropTypes.string.isRequired,
    }),
  ).isRequired,
};

export default About;
