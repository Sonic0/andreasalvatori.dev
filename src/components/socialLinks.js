import React from "react";
import PropTypes from "prop-types";

const SocialLinks = ({ userLinks }) => {
  const socialLinks = userLinks.map((element) => (
    <li className="px-5 my-5" key={element.label}>
      <span className="is-size-7-touch">
        <a
          href={element.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={element.label}
          className="hover-lift"
        >
          <i className={element.iconClassName} aria-hidden="true"></i>
        </a>
      </span>
    </li>
  ));

  return <ul className="is-inline-flex social-links-list">{socialLinks}</ul>;
};

SocialLinks.propTypes = {
  userLinks: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired,
      iconClassName: PropTypes.string.isRequired,
    }),
  ).isRequired,
};

export default SocialLinks;
