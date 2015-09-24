var Config = {
  //webServiceUrl: "http://localhost:4335/OxLogServices.asmx",
  webServiceUrl: "http://demo.oxirium.com/PROTimbreoWS/OxLogServices.asmx",
  company: "PROTimbreo",
  system: "PROTimbreo",
  language: 'es',
  currentVersion: '1.0',
  defaultAjaxCall: {
      method: "[nothing]",
      data: {},
      beforeSend: function(soapEnvelope) {},
      success: function(data, textStatus, jqXHR) {},
      error: function(jqXHR, textStatus, errorThrown) {},
      then: function() {}
  }
};
var GeneralFunctions = {
  CallAJAX: function(options) {

    var defaults = Config.defaultAjaxCall;
    $.extend(defaults, options);

    $.ajax({
        type: "POST",
        url: Config.webServiceUrl + "/" + defaults.method,
        async: defaults.async,
        data: JSON.stringify(defaults.data),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        beforeSend: defaults.beforeSend,
        success: function (response) {
          var result = eval("(" + response.Result + ")");
          defaults.success(result, response.HasErrors, response.Message);
        },
        error: function (result) {
            console.log('ERROR on CallAJAX [' + defaults.method + ']' + result.status + ' ' + result.statusText + " - " + result.responseText);
            defaults.error(result);
        }
    });

  },
  soapInvoque: function(options) {
        //options = {method, data, beforeSend, success, error, then}
        var defaults = Config.defaultAjaxCall;
        $.extend(defaults, options);
        try {
            $.soap({
                    url: Config.webServiceUrl,
                    method: defaults.method,
                    appendMethodToURL: false,
                    SOAPAction: "http://wsaoXlog.oxirium.com.ar/" + defaults.method,
                    noPrefix: true,
                    soap12: false,
                    namespaceURL: "http://wsaoXlog.oxirium.com.ar/",
                    data: defaults.data,
                    beforeSend: defaults.beforeSend
                })
                .done(function(data, textStatus, jqXHR) {
                    var respuesta = GeneralFunctions.getObjectResultFromXml(data, defaults.method);

                    try {
                        respuesta.Result = eval(eval(respuesta.Result));
                    } catch (e) {
                        respuesta.Result = eval(eval("(" + respuesta.Result + ")"));
                    }

                    respuesta.HasErrors = eval(respuesta.HasErrors);
                    defaults.success(respuesta, textStatus, jqXHR);
                })
                .fail(function(jqXHR, textStatus, errorThrown) {

                    defaults.error(jqXHR, textStatus, errorThrown);
                    if (defaults.then != undefined) {
                        defaults.then();
                    }

                })
                .then(defaults.then);
        } catch (e) {
            console.log("Ocurrió un error en la invocación a " + defaults.method, defaults, e);
            if (defaults.then != undefined) {
                defaults.then();
            }
        }
    },
    getArrayResultFromXml: function(fullResult, method) {

        var xmlEnvelope = fullResult.childNodes[0];

        var xmlBody = xmlEnvelope.childNodes[0];

        var xmlResponse = xmlBody.childNodes[0];

        var arrayResult = new Array();
        var numResult = 0;
        var strResult = "";
        var methodResult = null;
        for (i = 0; i < xmlResponse.childNodes.length; i++) {
            var item = xmlResponse.childNodes[i];
            if (item.nodeName == method + "Result") {
                methodResult = item.innerHTML;
            } else if (item.nodeName == "numResult") {
                numResult = item.innerHTML;
            } else if (item.nodeName == "strResult") {
                strResult = item.innerHTML;
            }
        }
        arrayResult = [methodResult, numResult, strResult];
        return arrayResult;
    },
    getObjectResultFromXml: function(data, metodo) {
        var response = data.getElementsByTagName(metodo + 'Response')[0];
        var respuesta = new X2JS().xml2json(response);
        return respuesta[metodo + 'Result'];
    },
    testConnection: function() {
        if (!navigator.network) {
            // set the parent windows navigator network object to the child window
            navigator.network = window.top.navigator.network;
        }

        // return the type of connection found
        return ((navigator.network.connection.type === "none" || navigator.network.connection.type ===
            null ||
            navigator.network.connection.type === "unknown") ? false : true);
    }

};
