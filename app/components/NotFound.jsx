import React from "react";
import Page from "./Page";
import { Link } from "react-router-dom";

function NotFound() {
    return (
        <Page title="not Found">
            <div className="text-center">
                <h2>Whoops, we can&rsquo;t find that page.</h2>
                <p className="lead text-muted">
                    You can visit the <Link to="/">homepage</Link> to get a fresh start...{" "}
                </p>
            </div>
        </Page>
    );
}

export default NotFound;
