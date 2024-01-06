import React, { Component } from "react"
// import { GatsbyImage } from "gatsby-plugin-image";
import { StaticImage } from "gatsby-plugin-image"
// import { Helmet } from "react-helmet";
// import { withPrefix } from "gatsby"

export default class Header extends Component {
  render() {
    return (
      <section class="head-wrapper">
        <StaticImage
          className="head-image-wrapper"
          src="../images/manga_board.png"
          alt="Made in Abyss"
          quality="50"
          placeholder="tracedSVG"
        />

        <div class="header-container">
          <span class="top-texts has-text-centered mt-3 is-size-5 has-text-weight-bold has-text-heliotrope">
            {this.props.nickName} || ¯\_(ツ)_/¯
          </span>

          {/* <div class="middle-texts">
            <div class="has-text-centered">
              <span class="is-size-4-touch is-size-3-desktop is-uppercase has-text-white">
                bla bla bla
              </span>{" "} <cite class="has-text-white">Linus Torvalds</cite>
            </div>
          </div> */}

          <span class="bottom-texts mb-3 has-text-heliotrope scroll-down">
            <i class="fas fa-2x fa-chevron-down"></i>
          </span>
        </div>
      </section>
    )
  }
}
