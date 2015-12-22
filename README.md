## Senf

A minimalistic comment hosting service. Senf is a service that can store comments from different sources. The idea is
similar to Disqus (https://disqus.com/) just way more barebones. But you can host it on your own hardware (or Heroku/Openshift).
To use Senf you include a tiny script on every article page. The script will render the existing comments and display a field to
enter new comments. The Senf script requires jQuery.

###Stack

* Node.js
* Express.js
* Passport.js (for authentication)
* EJS (for templates)
* Sqlite and Sequelize (for storage)


###How it works

Senf lets you collect comments from as many domains as you like. On every article page you have to include the following
script and stylesheet:

```html
<link href="https://<SENF SERVER>/widget/css/widget.css" rel="stylesheet">
...
<script src="https://<SENF SERVER>/widget/js/widget.js"></script>
<script>
    new SenfWidget({
        target: "comments",
        server: "https://<SENF SERVER>",
        user: "<EMAIL>"
    });
</script>
```

Please note that the Senf script requires jQuery to be present. The comment area will be rendered into a `div` element
with the `id` in the `target` property. It has to exist on the page. Users are identified by their email.

###Installation

1. Clone this repository
2. Install dependencies: `npm install` followed by `bower install`
3. Run the tests with `npm test`
4. Open `config.js` and modify it to your needs
4. Start the server with `npm start`


###Usage

1. The default port is `3000`
2. Point your browser to `localhost:3000` (or whatever port you have configured)
3. The setup process will start and ask you to create an admin account
4. After that you can log in and create domains
