import React, { Component } from "react"

export default class NickName extends Component {
  render() {
    return (
      <span>
        <strong>{this.props.authorName}</strong>{" - "}
        <span class="is-italic">{this.props.author}</span>{" - "}
        <span>{this.props.nickName}</span>
      </span>
    )
  }
}
