var jsonEditors = {};

django.jQuery(function () {
    if (typeof(jsoneditor) == "undefined")
        jsoneditor = {JSONEditor: JSONEditor};
    setInterval(function () {
        var fields = django.jQuery(".for_jsoneditor");
        for (var i = 0; i < fields.length; i++) {
            var $f = django.jQuery(fields[i]);
            var id = $f.attr("id") + "_jsoneditor";

            if (id.includes("__prefix__")) {
                continue;
            }
            
            var name = $f.attr("name") + "_jsoneditor";
            var $nxt = $f.parent().find('#' + id);
            if ($nxt.attr("name") == name) {
                continue;
            }
            var value = $f[0].value;
            var style = $f.attr("style");
            var disabled = $f.is(':disabled');
            var jsonschema = JSON.parse($f.attr("jsonschema"));
            var initOverrides = JSON.parse($f.attr("init_options"));
            var aceOverrides = JSON.parse($f.attr("ace_options"));

            $nxt.detach();
            if (style) {
                $nxt = django.jQuery('<div class="outer_jsoneditor" cols="40" rows="10" style="' + style + '" id="' + id + '" name="' + name + '"></div>');
            } else {
                $nxt = django.jQuery('<div class="outer_jsoneditor" cols="40" rows="10" id="' + id + '" name="' + name + '"></div>');
            }
            $f.parent().append($nxt);
            var fnc = function (f, nxt, value) {
                var initOptions = Object.assign({}, (initOverrides && typeof initOverrides === 'object') ? initOverrides : django_jsoneditor_init);
                initOptions['schema'] = jsonschema;
                
                // Extract collapsed option before passing to JSONEditor
                var shouldCollapse = initOptions['collapsed'] === true;
                // Remove collapsed and _original_mode from initOptions as they're not standard JSONEditor options
                delete initOptions['collapsed'];
                delete initOptions['_original_mode'];

                var editor = new jsoneditor.JSONEditor(nxt, Object.assign({
                    onChange: function () {
                        f.value = editor.getText();
                    },
                    // If switching to code mode, properly initialize with ace options
                    onModeChange: function(endMode, startMode) {
                        if (endMode == 'code') {
                            editor.aceEditor.setOptions(aceOverrides ? aceOverrides : django_jsoneditor_ace_options);
                        } else if (endMode == 'tree' && shouldCollapse && typeof editor.collapseAll === 'function') {
                            // Collapse when switching to tree mode if collapsed option is set
                            editor.collapseAll();
                        }
                    },
                    onEditable: function() {
                        return !disabled;
                    }
                }, initOptions));

                // Load the editor.
                try {
                    editor.set(JSON.parse(value));
                    // Collapse all fields if collapsed option is set and editor is in tree mode
                    if (shouldCollapse && editor.mode === 'tree' && typeof editor.collapseAll === 'function') {
                        editor.collapseAll();
                    }
                } catch (e) {
                    // Force editor mode to "code" if there are JSON parse errors.
                    editor.setMode('code');

                    // Initialise contents of form even on unparseable JSON on load
                    editor.setText(value);
                }

                // If initialized in code mode, set ace options right away
                if (editor.mode == 'code') {
                    editor.aceEditor.setOptions(django_jsoneditor_ace_options);

                    // If collapsed is true, minify the JSON (don't format it)
                    // Otherwise, format it nicely
                    if (shouldCollapse) {
                        // Minify the JSON by getting the text and setting it back as minified
                        var currentText = editor.getText();
                        try {
                            var parsed = JSON.parse(currentText);
                            var minified = JSON.stringify(parsed);
                            editor.setText(minified);
                        } catch (e) {
                            // If minification fails, just keep the current text
                        }
                    } else {
                        // Format the code on first load
                        editor.format();
                    }
                }

                return editor;
            };
            jsonEditors[id] = fnc($f[0], $nxt[0], value);
        }
    }, 10);
});
