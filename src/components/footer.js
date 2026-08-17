import React from "react";

const MainFooter = () => {
  return (
    <footer className="personalized-footer is-size-7-touch">
      <div className="content mt-5 has-text-centered">
        {/* Built with... / thanks to... */}
        <p>
          © {new Date().getFullYear()}
          {` `}Andrea Salvatori -{` `}
          <span aria-hidden="true">
            <b>(づ￣ ³￣)づ━☆ﾟ.*･｡ﾟ</b>
          </span>
          {` `}
          <a
            href="https://github.com/Sonic0/personal-website"
            target="_blank"
            rel="noopener noreferrer"
            className="hover-lift"
          >
            Source Code
          </a>
        </p>
      </div>
    </footer>
  );
};

export default MainFooter;
