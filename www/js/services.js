angular.module("services", [])
  .service('ServicioTimbreo', function($http, $timeout){
    var tipoResultados =[
      {
        Nombre: 'Positivo',
        Codigo: 'POSITIVO'
      },
      {
        Nombre: 'Negativo',
        Codigo: 'NEGATIVO'
      },
      {
        Nombre: 'No Timbreable',
        Codigo: 'NOTIMBREABLE'
      },
      {
        Nombre: 'No Responde',
        Codigo: 'NORESPONDE'
      }
    ];

    var service = {
      obtenerTipoResultadoPorCodigo: function(codigo){
        var tipoResultadoSeleccionado = _.where(tipoResultados, { Codigo: codigo });
        return (tipoResultadoSeleccionado.length > 0 ? tipoResultadoSeleccionado[0] : { Nombre: "", Codigo: "" });
      },
      obtenerTiposReclamo: function(options){
        GeneralFunctions.soapInvoque({
          method: "ObtenerTiposReclamo",
          data: {},
          beforeSend: options.beforeSend,
          success: options.success,
          error: options.error,
          then: options.then
        });
      },
      setearActual: function(idHojaRutaDetalle){
        var hojaDeRuta = eval(window.localStorage.getItem('hojaDeRuta'));

        for (var i = 0; i < hojaDeRuta.Detalles.length; i++) {
          hojaDeRuta.Detalles[i].Actual = false;
          if(hojaDeRuta.Detalles[i].Id_HojaRuta_Detalle == idHojaRutaDetalle){
            hojaDeRuta.Detalles[i].Actual = true;
          }
        }

        window.localStorage.setItem('hojaDeRuta', "(" + JSON.stringify(hojaDeRuta) + ")");
      },
      setearTipoRespuesta: function(options) {

        GeneralFunctions.soapInvoque({
          method: "EstablecerTipoResultado",
          data: options.data,
          beforeSend: options.beforeSend,
          success: function(result) {

            if(!result.HasErrors) {

              var tipoResultadoSeleccionado = _.where(tipoResultados, { Codigo: options.data.codigoTipoResultado });
              tipoResultadoSeleccionado = tipoResultadoSeleccionado[0];

              var hojaDeRuta = eval(window.localStorage.getItem('hojaDeRuta'));

              for (var i = 0; i < hojaDeRuta.Detalles.length; i++) {

                if(hojaDeRuta.Detalles[i].Id_HojaRuta_Detalle == options.data.idHojaRutaDetalle){
                  hojaDeRuta.Detalles[i].Tipo_Resultado = tipoResultadoSeleccionado;
                  break;
                }

              }

              window.localStorage.setItem('hojaDeRuta', "(" + JSON.stringify(hojaDeRuta) + ")");
            }

            options.success(result.Result, result.HasErrors, result.Message);
          },
          error: options.error,
          then: options.then
        });


      },
      destruirSesion: function(){
        window.localStorage.setItem('hojaDeRuta', "");
      },
      obtenerHojaDeRutaActiva: function() {
        var hojaRuta = window.localStorage.getItem('hojaDeRuta');
        return ( hojaRuta == undefined || hojaRuta == null || hojaRuta == '') ? {} : eval(window.localStorage.getItem('hojaDeRuta'));
      },

      vincularTimbreroHojaDeRuta: function(options){
        GeneralFunctions.soapInvoque({
          method: "VincularTimbreroHojaDeRuta",
          data: options.data,
          beforeSend: options.beforeSend,
          success: options.success,
          error: options.error,
          then: options.then
        });
      },

      obtenerHojaDeRutaPorDNI: function(options) {

        GeneralFunctions.soapInvoque({
          method: "ObtenerHojaDeRutaPorDNI",
          data: options.data,
          beforeSend: options.beforeSend,
          success: function(result, hasError, message) {
            var hojaDeRuta = result.Result;

            if(!result.HasErrors && result.Result.Id_HojaRuta_Cabecera != 0) {

              hojaDeRuta = result.Result;
              for (var i = 0; i < hojaDeRuta.Detalles.length; i++) {

                var obtuvoResultado = false;
                var resultado = {};

                var direccion = hojaDeRuta.Detalles[i].Domicilio.Nombre + ", Capital Federal";

                $.ajax({
                  method: 'GET',
                  url: 'http://maps.google.com/maps/api/geocode/json?address=' + direccion + '&sensor=false',
                  async: false,
                  success: function(data){
                    resultado = data;
                    obtuvoResultado = true;
                  }
                });

                hojaDeRuta.Detalles[i].Orden = "(" + (i+1) + "/" + hojaDeRuta.Detalles.length + ")";
                hojaDeRuta.Actual = false; //Indica si es el detalle que se está viendo ahora mismo

                if(obtuvoResultado && resultado.results.length > 0) {
                  resultado = resultado.results[0];

                  hojaDeRuta.Detalles[i].Coordenadas = {
                    latitude: resultado.geometry.location.lat,
                    longitude: resultado.geometry.location.lng,
                  }

                }
                else {
                  hojaDeRuta.Detalles[i].Coordenadas = {
                    latitude: 0,
                    longitude: 0,
                  }
                }
              }
            }

            window.localStorage.setItem('hojaDeRuta', "(" + JSON.stringify(hojaDeRuta) + ")");
            options.success(hojaDeRuta, result.HasErrors, result.Message);
          },
          error: options.error,
          then: options.then
        });
      },

      obtenerDomicilioActual: function() {
        var hojaDeRuta = eval(window.localStorage.getItem('hojaDeRuta'));
        var detalles = hojaDeRuta.Detalles;

        var detalle = _.where(detalles, { Actual: true });

        if(detalle.length == 0) {
          detalle = service.obtenerSiguienteDomicilioAVisitar();
        }
        else {
          detalle = detalle[0];
        }

        return detalle;
      },

      obtenerSiguienteDomicilioAVisitar: function() {
        var hojaDeRuta = eval(window.localStorage.getItem('hojaDeRuta'));
        var detalles = hojaDeRuta.Detalles;

        if(hojaDeRuta == null || hojaDeRuta == undefined){
          return null;
        }

        var detalleSeleccionado = null;
        var indice = _.findLastIndex(detalles, { Actual: true });
        //indice = indice < 0 ? 0 : indice;

        for (var i = 0; i < hojaDeRuta.Detalles.length; i++) {
          hojaDeRuta.Detalles[i].Actual = false;
        }

        for (var i = (indice + 1); i < hojaDeRuta.Detalles.length; i++) {

          if(hojaDeRuta.Detalles[i].Tipo_Resultado == undefined || hojaDeRuta.Detalles[i].Tipo_Resultado == null) {
            hojaDeRuta.Detalles[i].Actual = true;
            detalleSeleccionado = hojaDeRuta.Detalles[i];
            break;
          }
        }

        if(detalleSeleccionado == null) {
          for (var i = 0; i <= indice; i++) {
            if(hojaDeRuta.Detalles[i].Tipo_Resultado == undefined || hojaDeRuta.Detalles[i].Tipo_Resultado == null) {
              hojaDeRuta.Detalles[i].Actual = true;
              detalleSeleccionado = hojaDeRuta.Detalles[i];
              break;
            }
          }
        }

        //Actualizo la hoja de ruta
        window.localStorage.setItem('hojaDeRuta', "(" + JSON.stringify(hojaDeRuta) + ")");

        //Si el detalle seleccionado es null entonces ya no hay más por recorrer
        return detalleSeleccionado;
      }
    }

    return service;

  });
