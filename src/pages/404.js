import React from "react";
import { Link } from "gatsby";
import Seo from "../components/seo";

const NotFoundPage = () => (
  <div>
    <section className="section has-text-centered">
      <div className="container">
        <p>
          <span className="has-text-mauve is-size-1">4</span>
          <span className="has-text-primary is-size-1">0</span>
          <span className="has-text-heliotrope is-size-1">4</span>{" "}
          <span className="is-size-1">page not found</span>
        </p>
        <p>
          <br />
          <span className="has-text-heliotrope is-size-1" aria-hidden="true">
            (╯°□°）╯︵ ┻━┻
          </span>
        </p>
        <p className="mt-5">
          <Link to="/" className="button is-primary is-rounded hover-lift">
            Take me home
          </Link>
        </p>
      </div>
    </section>
  </div>
);

export default NotFoundPage;

export const Head = () => <Seo title="404: Not found" />;
