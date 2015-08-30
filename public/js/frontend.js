(function (parent) {
    function showError(error) {
        alert("Server error: " + error && error.responseText ? error.responseText : "unknown");
    }

    parent.frontend = {};

    parent.frontend.comment = {
        remove: function (id) {
            vex.dialog.confirm({
                message: "Do you really want to delete this comment?",
                callback: function (value) {
                    if (value) {
                        $.post('/remove_comment', {
                            id: id
                        }).done(function () {
                            window.location.reload();
                        }).fail(showError);
                    }
                }
            });
        }
    };

    parent.frontend.domain = {
        domainRegex: /^(?!:\/\/)([a-zA-Z0-9]+\.)?[a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,6}?$/i,

        check: function (domain) {
            var valid = this.domainRegex.test(domain);
            if (valid || domain === 'localhost') {
                $(".vex-dialog-button-primary").show();
            } else {
                $(".vex-dialog-button-primary").hide();
            }
        },

        add: function () {
            vex.dialog.open({
                message: 'Create new domain',
                input: [
                    '<input name="name"',
                    'placeholder="Domain name"',
                    'required onkeyup="frontend.domain.check(this.value)"',
                    'autocomplete="off">'
                ].join(' '),
                buttons: [
                    $.extend({}, vex.dialog.buttons.YES, {text: 'Create'}),
                    $.extend({}, vex.dialog.buttons.NO, {text: 'Cancel'})
                ],
                afterOpen: function () {
                    $("input[name='name']").focus();

                    // Display the submit button only when the input is validated
                    $(".vex-dialog-button-primary").hide();
                },
                callback: function (data) {
                    if (data !== false && data.name) {
                        $.post('/domains', data).done(function () {
                            window.location.reload();
                        }).fail(showError);
                    }
                }
            });
        },

        remove: function (id) {
            vex.dialog.confirm({
                message: "Do you really want to delete this domain? All comments will be lost.",
                callback: function (value) {
                    if (value) {
                        $.post('/remove_domain', {
                            id: id
                        }).done(function () {
                            window.location.reload();
                        }).fail(showError);
                    }
                }
            });
        }
    };
})(window);