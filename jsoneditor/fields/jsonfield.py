from jsonfield import JSONField as _JSONField
from jsonfield.forms import JSONField as _JSONFormField

from jsoneditor.forms import JSONEditor


class JSONFormField(_JSONFormField):
    widget = JSONEditor

    def __init__(self, *av, **kw):
        # Extract collapsed parameter if provided
        collapsed = kw.pop("collapsed", False)
        # Get widget from kwargs or use class default
        widget = kw.get("widget", self.widget)
        # If widget is the class (not an instance), instantiate it with collapsed option
        if widget == self.widget or (
            isinstance(widget, type) and issubclass(widget, self.widget)
        ):
            # Merge with existing init_options if widget was already instantiated elsewhere
            init_options = {"collapsed": collapsed}
            widget = self.widget(init_options=init_options)
        elif isinstance(widget, self.widget):
            # Update existing widget instance
            if widget.init_options is None:
                widget.init_options = {}
            widget.init_options["collapsed"] = collapsed
        kw["widget"] = widget
        super(JSONFormField, self).__init__(*av, **kw)


class JSONField(_JSONField):
    def formfield(self, **kwargs):
        defaults = {
            "form_class": kwargs.get("form_class", JSONFormField),
        }
        defaults.update(kwargs)
        return super(JSONField, self).formfield(**defaults)
