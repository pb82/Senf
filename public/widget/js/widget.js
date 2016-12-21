/**
 * Senf widget constructor function. To construct a
 * commenting form you have to provide a properties
 * object in the form of:
 * {
 *      "target":   <A DIV ELEMENT TO RENDER THE COMMENTS TO>
 *      "server":   <SENF SERVER URL>
 *      "user":     <YOUR USER NAME>
 * }
 * @param props Properties object
 * @constructor
 */
var SenfWidget = function (props) {
    var requiredProps = ["target", "server", "user"];

    /**
     * Don't use fancy 'map' or 'indexOf' here for the sake of old
     * browser support.
     */
    for (var i = 0; i < requiredProps.length; i++) {
        if (!props[requiredProps[i]]) {
            throw new Error(requiredProps[i] + " needs to be defined", "widget.js");
        }
    }

    /**
     * API URL to fetch all comments for a given user,
     * domain and article
     */
    var url = props.server + "/api/v1/comments";

    /**
     * Append a single comment to the comments list
     */
    function appendComment(commentsList, comment, cmd) {
        commentsList[cmd](
            [
                '<LI>',
                '<DIV class="senf_author">',
                comment.author || "Anonymous",
                '</DIV>',
                '<DIV class="senf_comment">',
                comment.text,
                '</DIV>',
                '</LI>'
            ].join('')
        );
    }

    function getCommentsList() {
        return $("div#" + props.target + ">div#senf_comments ul");
    }

    function clearLastComment() {
        $("div#senf_form > input").val("");
        $("div#senf_form > textarea").val("");
    }

    function fillStats(numberOfComments) {
        $("div#senf_stats").html(numberOfComments + " comment(s)");
    }

    /**
     * Fetch comments for this domain and article from the server
     * and render them. Assumes that jQuery is available.
     */
    function renderComments() {
        $.ajax({
            type: 'GET',
            url: url,
            crossDomain: true,
            dataType: 'json',
            data: {user: props.user}
        }).done(function (data) {
            if (data && data.length) {
                fillStats(data.length);
                /**
                 * Successfuly got an array of comments now in the form of
                 * {
                 *      "name": <AUTHOR>
                 *      "text": <COMMENT>
                 * }
                 * @type {*|jQuery|HTMLElement}
                 */
                var commentsList = getCommentsList();
                for (var i = 0; i < data.length; i++) {
                    /**
                     * Append all comments to the already created
                     * <ul> list in the senf widget section.
                     */
                    appendComment(commentsList, data[i], 'append');
                }
            }
        }).fail(function () {
            throw new Error("Invalid request. See server logs for details", "widget.js");
        });
    }

    /**
     * Renders a div with input fields for users to leave
     * comments.
     */
    function renderForm() {
        var targetDiv = document.getElementById(props.target), submitBtn;
        if (!targetDiv) {
            return;
        }

        targetDiv.innerHTML = [
            '<DIV id="senf_stats"></DIV>',
            '<DIV id="senf_comments">',
            '<UL>',
            '</UL>',
            '</DIV>',
            '<DIV id="senf_form">',
            '<INPUT type="text" placeholder="Name / Email" name="poster" maxlength="50">',
            '<TEXTAREA cols="40" rows="5" name="new_comment">',
            '</TEXTAREA>',
            '<BUTTON id="senf_submit">Submit comment</BUTTON>',
            '</DIV>'
        ].join('\n');

        /**
         * Get the submit button from the generated html and set
         * the onclick function
         * @type {HTMLElement}
         */
        submitBtn = document.getElementById("senf_submit");
        submitBtn.onclick = function () {
            var author = $("div#senf_form > input").val()
                , commentText = $("div#senf_form > textarea").val();

            $.ajax({
                type: 'POST',
                url: url,
                crossDomain: true,
                dataType: 'json',
                data: {
                    user: props.user,
                    author: author,
                    text: commentText
                }
            }).done(function (comment) {
                appendComment(getCommentsList(), comment, 'prepend');
                clearLastComment();
            }).fail(function () {
                throw new Error("Invalid request. See server logs for details", "widget.js");
            });
        }
    }

    renderForm();
    renderComments();
};