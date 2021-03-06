function init(Survey, $) {
  $ = $ || window.$;
  var widget = {
  name: "tagboxmedical",
  title: "Tag box",
  iconName: "icon-tagbox",
  widgetIsLoaded: function() {
    return typeof $ == "function" && !!$.fn.select2;
  },
  defaultJSON: {
    choices: ["Item 1", "Item 2", "Item 3"],
    url: ""
  },
  htmlTemplate: "<select multiple='multiple' style='width: 100%;'></select>",
  isFit: function(question) {
    return question.getType() === "tagboxmedical";
  },
  activatedByChanged: function(activatedBy) {
    Survey.JsonObject.metaData.addClass(
      "tagboxmedical", [{
        name: "hasOther",
        visible: false
      }],
      null,
      "checkbox"
    );
    Survey.JsonObject.metaData.addProperty("tagboxmedical", {
      name: "select2Config",
      default: null
    });
  },
  fixStyles: function(el) {
    el.parentElement.querySelector(".select2-search__field").style.border =
      "none";
  },
  afterRender: function(question, el) {
    var self = this;
    var settings = {
        minimumInputLength: 3,
        ajax: {
          delay: 250,
          url: 'https://clinicaltables.nlm.nih.gov/api/conditions/v3/search',
          data: function(params) {
            self.term = params.term
            var query = {
              terms: params.term,
              df: "primary_name"
            }
            return query;
          },
          processResults: function(data) {

            var codes = data[1];
            var conditions = data[3]
            var dataItems = codes.map(
              function (a, i) {
                return {"id": a, "text": conditions[i][0] }
              }
            )

            var results = dataItems.map(function(dataItem) {
              return {
                id: dataItem.text,
                text: dataItem.text
              }
            })

            results.push({ id: self.term, text: self.term})

            return {
              results: results
            };
          }
        },
      }
    var $el = $(el).is("select") ? $(el) : $(el).find("select");
    $el.select2({
      tags: "true",
      disabled: question.isReadOnly,
      theme: "classic"
  });

      var updateValueHandler = function() {
        if ($el.find("option").length) {
          $el.val(question.value).trigger("change");

        } else {
          for (var i=0; i<question.value.length; i++) {
            var newOption = new Option(
                question.value[i], //TODO if question value is object then need to improve
                question.value[i],
                true,
                true
              )
            $el.append(newOption)
          }
        }
      }

    var updateChoices = function() {
      $el.select2().empty();
      $el.select2(settings);

      updateValueHandler();
    };

    question.readOnlyChangedCallback = function() {
      $el.prop("disabled", question.isReadOnly);
    };
    question.registerFunctionOnPropertyValueChanged(
      "visibleChoices",
      function() {
        updateChoices();
      }
    );
    question.valueChangedCallback = updateValueHandler;
    $el.on("select2:select", function(e) {
      question.value = (question.value || []).concat(e.params.data.id);
    });
    $el.on("select2:unselect", function(e) {
      var index = (question.value || []).indexOf(e.params.data.id);
      if (index !== -1) {
        var val = question.value;
        val.splice(index, 1);
        question.value = val;
      }
    });
    updateChoices();
  },
  willUnmount: function(question, el) {
    $(el)
      .find("select")
      .off("select2:select")
      .select2("destroy");
    question.readOnlyChangedCallback = null;
  }
};

  Survey.CustomWidgetCollection.Instance.addCustomWidget(widget, "customtype");
}

if (typeof Survey !== "undefined") {
  init(Survey, window.$);
}

export default init;
