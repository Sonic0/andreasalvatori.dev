import React from "react";
import PropTypes from "prop-types";

const NickName = ({ authorName, author, nickName }) => {
  return (
    <span>
      <strong>{authorName}</strong>
      {" - "}
      <span className="is-italic">{author}</span>
      {" - "}
      <span>{nickName}</span>
    </span>
  );
};

NickName.propTypes = {
  authorName: PropTypes.string.isRequired,
  author: PropTypes.string.isRequired,
  nickName: PropTypes.string.isRequired,
};

export default NickName;
