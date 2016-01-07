$(function(){

  curry = function (fn) {
    var slice = [].slice,
        args  = slice.call(arguments, 1);
    return function () {
      return fn.apply(this, args.concat(slice.call(arguments)));
    };
  };

  
  Style = {
    createStylesheet: function(){
      var style = document.createElement("style")
      // Add a media (and/or media query) here if you'd like!
      // style.setAttribute("media", "screen")
      // style.setAttribute("media", "only screen and (max-width : 1024px)")
      style.appendChild(document.createTextNode(""));
      document.head.appendChild(style)
      return style.sheet
    },
    stylesheet: function(){
      if(this._stylesheet){return this._stylesheet}
        else {
          this._stylesheet = this.createStylesheet();
          return this._stylesheet
        }
    },
    addCSSRule: function(selector, rules, index) {
      var sheet = this.stylesheet()
      if("insertRule" in sheet) {
        sheet.insertRule(selector + "{" + rules + "}", index);
      }
      else if("addRule" in sheet) {
        sheet.addRule(selector, rules, index);
      }
    }
  }

  // uses 'binding-tag' attr
  // format: binding-tag='class_name,id,attribute'
  getBindingTags = function (css_selector){
    var bindings = []
    bindingTags = $(css_selector).find("[binding-tag]")
    $.each(bindingTags, function(index, tag){
      var $tagElement = $(tag)
      var tagName = $tagElement.attr("binding-tag")
      var components = tagName.split(",")
      var model_name = components[0]
      var id = components[1]
      var attribute = components[2]
      bindings.push({
        dom_elements: $("*[binding-tag='"+tagName+"']"),
          model_name: model_name,
                  id: id,
           attribute: attribute,
      })
    })
    return bindings
  }

  initBindings = function(bindings) {
    $.each(bindings, function(index, binding){
      var $dom_elements = binding['dom_elements']
      var model_name    = binding['model_name']
      var id            = binding['id']
      var attribute     = binding['attribute']
      var channel       = channels[model_name]
      channel.bind(
        (model_name+'-'+id+'-'+attribute+'-update'),
        curry(updateElement, $dom_elements)
      )
    })
  }

  updateElement = function($dom_elements, new_value) {
    $dom_elements.val(new_value)
    $dom_elements.attr("value", new_value)
    $dom_elements.text(new_value)
  }

  addElement = function($container, $completedTemplate){
    $container.append(
      $("<div>").append($completedTemplate.clone()).html()
    )
  }

  deserialize = function(record){
    return JSON.parse(record)
  }
  
  processNewRecords = function(serializedRecords){
    serializedRecords = $.makeArray(serializedRecords)
    serializedRecords.forEach(function(record){
      record         = deserialize(record)
      model_name     = record['record_class']   
      $container     = $("."+model_name+'-index')
      $template      = $container.find("[template]")
      $templateClone = cloneTemplate($template, record)
      $templateClone.removeAttr("template")
      $templateClone.attr(
        "record-id",
        (model_name+","+record['id'])
      )
      addElement($container, $templateClone)
      initBindings(getBindingTags($templateClone))
      initToggleInitialState($templateClone)
      processUpdateRecords(JSON.stringify(record))
    })
  }

  cloneTemplate = function($template, record){
    $template = $template.clone()
    templateAttrs = $template.find("[template-attr]")
    var id = record['id']
    $.each(templateAttrs, function(index, elem){
      var $elem = $(elem)
      var model_name = record['record_class']
      var attr = $elem.attr('template-attr')
      $elem.text(record[attr])
      $elem.val(record[attr])
      $elem.removeAttr('template-attr')
      $elem.attr("binding-tag", model_name+','+id+','+attr)
    })
    return $template
  }
  
  findMatchingNodes = function(record_class, id){
    return $("*[record-id='"+record_class+","+id)
  }

  processUpdateRecords = function(serializedRecords){
    serializedRecords = $.makeArray(serializedRecords)
    serializedRecords.forEach(function(record){
      record = deserialize(record)
      model_name = record['record_class']
      id = record['id']
      for (var key in record){
        var new_val = record[key]
        console.log(record)
        var bindingTag = model_name+','+id+','+key        
        channels[model_name].trigger(
          (model_name+'-'+id+'-'+key+'-update'),
          new_val   
        )
        // for some reason this is also necessary when
        // the binding elements are not in a [template]
        // although this should be called by the above 'trigger'
          updateElement(
            $("[binding-tag='"+bindingTag+"']"),
            new_val
          )
      }
    })
  }
  
  processDestroyRecords = function(serializedRecords){
  serializedRecords = $.makeArray(serializedRecords)
   serializedRecords.forEach(function(record){
     record = deserialize(record)
     $matchingNodes = findMatchingNodes(
        record['record_class'],
        record['id']
      )
     $matchingNodes.remove()
   })
  }


  initFormBindings = function(selector){
    if (!selector){
      selector = "*"
    }
    $(document).on("submit", (selector+" form"), function(e){
      var $form = $(e.currentTarget)
      if ($form[0].hasAttribute("skip-sockets")) {
        return true
      }
      e.preventDefault();
      var serializedAttrs = $form.serialize()
      var action = $form.attr("action")
      var method = $form.attr("method")
      var $methodOverride = $form.find("[name=_method]")
      if ($methodOverride.length > 0){
        method = $methodOverride.val()
      }
      $.ajax({
        url: action,
        method: method,
        data: serializedAttrs
      })
      return false
    })
  }


  initToggleInitialState = function(selector){
    var $togglers = $(selector).find("[toggles]")
    $.each($togglers, function(index, e){
      var $toggler = $(e)
      var target = $toggler.attr("toggles")
      var $target = $toggler.siblings(target)
      $target.hide()
      $toggler.attr("hiding", "")
    })
  }

  initTogglerListeners = function(selector){
    $(document).on("click", (selector+" [toggles]"), function(e){
      var $toggler = $(e.currentTarget)
      var target = $toggler.attr("toggles")
      var $target = $toggler.siblings(target)
      if ($toggler[0].hasAttribute('hiding')){
        $toggler.removeAttr('hiding')
        $target.show()
      } else {
        $toggler.attr("hiding", "")
        $target.hide()
      }
    })
  }

  initServerSeeds = function(){
    $.each($("[init]"), function(index, init){
      var $init = $(init)
      var model_name = $init.attr("init")
      var serialized_records = $init.text()
      var records = deserialize(serialized_records)
      records.forEach(function(record){
        processNewRecords(JSON.stringify(record))
      })
      $init.hide()
    }) 
  }

  SocketHelpers = {
    addedHooks: [],
    initialize: function(classes, websocketBaseurl){
      // hide templates
      Style.addCSSRule("[template]", "display: none")
      // server hooks
      dispatcher = new WebSocketRails(websocketBaseurl)
      channels   = {}
      classes.forEach(function(class_name){
        var name = class_name
        channels[name] = dispatcher.subscribe(name)
        var channel = channels[name]
        channel.bind('create', processNewRecords)
        channel.bind('update', processUpdateRecords)
        channel.bind('destroy', processDestroyRecords)
        // SocketHelpers.addedHooks.forEach(function(hook){
        //   var channelName = hook['channelName'],
        //       callback    = hook['callback']
        //   channels
        // })
      })

      // client hooks
      initBindings(getBindingTags("*"))
      initFormBindings("*")
      initToggleInitialState("*")
      initTogglerListeners("*")
      initServerSeeds()
      return dispatcher
    }
  }
})
