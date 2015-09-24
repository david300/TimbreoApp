angular.module('starter.controllers', [])

.controller('TimbreoCtrl', function($scope, $state, ServicioTimbreo) {
  $scope.hojaDeRuta = ServicioTimbreo.obtenerHojaDeRutaActiva();

  if($scope.hojaDeRuta == {})  {
    $state.go("auth");
  }

  $scope.logout = function(){
    ServicioTimbreo.destruirSesion();
    $state.go("auth");
  };
})

.controller('HojaRutaCtrl', function($scope, $state, $ionicPopup, $ionicModal, ServicioTimbreo) {

  $ionicModal.fromTemplateUrl('templates/timbreos/modalHojaRutaDetalles.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.detalleModal = modal;
  });

  $scope.hojaDeRuta = ServicioTimbreo.obtenerHojaDeRutaActiva();

  $scope.mostrarDetalle = function(detalle) {
    $scope.detalleSeleccionado = detalle;
    $scope.detalleModal.show();
    $scope.mostrarTimbrear = (detalle.Tipo_Resultado == undefined || detalle.Tipo_Resultado == null);
  };

  $scope.verMapa = function() {
    $scope.detalleModal.hide();
    ServicioTimbreo.setearActual($scope.detalleSeleccionado.Id_HojaRuta_Detalle);
    $state.go("timbreo.mapa");
  }

  $scope.verTimbreo = function() {
    $scope.detalleModal.hide();
    ServicioTimbreo.setearActual($scope.detalleSeleccionado.Id_HojaRuta_Detalle);
    $state.go("timbreo.registro");
  }


  if($scope.hojaDeRuta == {})  {
    $state.go("auth");
  }
})

.controller('MapaTimbreoCtrl', function($scope, $state, $cordovaGeolocation, $ionicLoading, $ionicPopup, $timeout, ServicioTimbreo) {
  $scope.hojaDeRuta = ServicioTimbreo.obtenerHojaDeRutaActiva();
  for (var i = 0; i < $scope.hojaDeRuta.Detalles.length; i++) {
    var detalle = $scope.hojaDeRuta.Detalles[i];
    $scope.hojaDeRuta.Detalles[i].options = {
          labelContent: $scope.hojaDeRuta.Detalles[i].Orden + " " + ((detalle.Tipo_Resultado != undefined && detalle.Tipo_Resultado != null) ? detalle.Tipo_Resultado.Nombre : "A Visitar" ),
          labelAnchor: "5 0",
          labelClass: "marker-labels"
        };

    if($scope.hojaDeRuta.Detalles[i].Tipo_Resultado != undefined && $scope.hojaDeRuta.Detalles[i].Tipo_Resultado != null){
      $scope.hojaDeRuta.Detalles[i].icon = 'img/markers/pin-' + $scope.hojaDeRuta.Detalles[i].Tipo_Resultado.Codigo + '.png';
    }
    else {
      $scope.hojaDeRuta.Detalles[i].icon = 'img/markers/siguiente.png';
    }
  }


  if($scope.hojaDeRuta == {})  {
    $state.go("auth");
  }

  $scope.detalleSeleccionado = ServicioTimbreo.obtenerDomicilioActual();
  $scope.detalleSeleccionado = $scope.detalleSeleccionado == null ? $scope.hojaDeRuta.Detalles[0] : $scope.detalleSeleccionado;

  //Agrego el coso que te dice cual es el posta
  // $scope.hojaDeRuta.Detalles.push({
  //   Coordenadas: {
  //     latitude: $scope.detalleSeleccionado.Coordenadas.latitude,
  //     longitude: $scope.detalleSeleccionado.Coordenadas.longitude
  //   },
  //   Id_HojaRuta_Detalle: $scope.detalleSeleccionado + "_" + 1,
  //   EsUsuario: true,
  //   icon: 'img/markers/current.png'
  // });
  $scope.goToCurrent = function(){
    if($scope.detalleSeleccionado != null){
      $scope.map.center = {
        latitude: $scope.detalleSeleccionado.Coordenadas.latitude,
        longitude: $scope.detalleSeleccionado.Coordenadas.longitude
      };
      $scope.map.zoom = 19;
    }
  }

  $scope.mostrarMapa = true;

  $scope.map = {
    doCluster: true,
    center: {
      latitude: $scope.detalleSeleccionado.Coordenadas.latitude,
      longitude: $scope.detalleSeleccionado.Coordenadas.longitude
    },
    zoom: 19,
    marker:
    {
      events: {
        click: function (gMarker, eventName, model) {
          $scope.map.center = {
            latitude: model.Coordenadas.latitude,
            longitude: model.Coordenadas.longitude
          }
          $scope.map.zoom = 19;
          //marker.showWindow = true;
          $scope.$apply();
          //window.alert("Marker: lat: " + marker.latitude + ", lon: " + marker.longitude + " clicked!!")
        },
        dblclick: function (gMarker, eventName, model) {
          //alert("Double Clicked!");
        }
      }
    }
  };

  localizar();

  $timeout(function(){
    localizar();
  }, 10000);

  $scope.locate = function() {

    var posicionUsuario = _.where($scope.hojaDeRuta.Detalles, { EsUsuario: true });

    if(posicionUsuario.length == 0) {
      localizar();
    }
    else {
      posicionUsuario = posicionUsuario[0];
      $scope.map.center.latitude = posicionUsuario.Coordenadas.latitude;
      $scope.map.center.longitude = posicionUsuario.Coordenadas.longitude;
      $scope.map.zoom = 19;

      //$scope.$apply();
    }

  }

  function localizar() {
    $cordovaGeolocation
      .getCurrentPosition()
      .then(function(position) {

        var index = _.findLastIndex($scope.hojaDeRuta.Detalles, { EsUsuario: true });

        if(index < 0) {
          $scope.hojaDeRuta.Detalles.push({
            Coordenadas: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            },
            Id_HojaRuta_Detalle: 0,
            EsUsuario: true,
            icon: 'img/markers/posicion-usuario.png',
            options: {
              labelContent: "Vos",
              labelAnchor: "5 0",
              labelClass: "marker-labels"
            }
          });
        }
        else {
          $scope.hojaDeRuta.Detalles[index].Coordenadas = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          //$scope.$apply();
        }

        // $scope.map.center.latitude = posicionUsuario.Coordenadas.latitude;
        // $scope.map.center.longitude = posicionUsuario.Coordenadas.longitude;
        // $scope.map.zoom = 19;

      }, function(err) {
          $ionicLoading.hide();
          // error
          console.log("Location error!");
          console.log(err);
      });
  }
})

.controller('LoginCtrl', function($scope, $state, $ionicLoading, $ionicPopup, ServicioTimbreo){
  $scope.login = { dni: null, nroHojaRuta: null };
  $scope.showLogin = true;
  $scope.hojaDeRuta = null;

  $scope.textoVinculacion = "Vincular Por Comuna";

  $scope.$watch('login.nroHojaRuta', function(newValue, oldValue) {
    if(newValue == null || newValue == '') {
      $scope.textoVinculacion = "Vincular Por Comuna";
    }
    else {
      $scope.textoVinculacion = "Vincular Por Hoja de Ruta";
    }

    //$scope.$apply();
  });

  $scope.vincular = function() {
    ServicioTimbreo.vincularTimbreroHojaDeRuta({
      data: {
        nroHojaRuta: ($scope.login.nroHojaRuta == undefined ? '' : $scope.login.nroHojaRuta),
        idTimbrero: $scope.hojaDeRuta.Timbrero.Id_Timbrero
      },
      beforeSend: function(){
        $ionicLoading.show({
          template: 'Vinculando Hoja de Ruta'
        });
      },
      success: function(result) {
        $ionicLoading.hide();
        if(!result.HasErrors) {
          $scope.login.dni = result.Result;
          $scope.login();
        }
        else {
          $ionicPopup.alert({
						title: 'Vinculación',
						template: result.Message
					});
        }
      },
      error: function(){
        $ionicLoading.hide();
      }
    });
  }

  $scope.login = function() {

    ServicioTimbreo.obtenerHojaDeRutaPorDNI({
      data: { dni: $scope.login.dni },
      beforeSend: function() {
        $scope.hojaDeRuta = null;
        $ionicLoading.show({
          template: 'Obteniendo Hoja de Ruta'
        });
      },
      success: function(result, hasError, message) {
        $ionicLoading.hide();
        if(!hasError) {
          $scope.hojaDeRuta = result;
          if(result.Id_HojaRuta_Cabecera != 0) {
            $state.go("timbreo.registro");
          }
          else {
              $scope.showLogin = false;
          }
        }
        else {
          $ionicPopup.alert({
						title: 'Ingreso',
						template: message
					});
        }
      },
      error: function() {
        $ionicLoading.hide();
      }
    });
  }
})

.controller('RegistrarTimbreoCtrl', function($scope, $state, $ionicModal, $ionicLoading, $ionicPopup, ServicioTimbreo) {
  $scope.init = function() {
    if($scope.hojaDeRuta == {})  {
      $state.go("auth");
    }

    $scope.hojaDeRuta = ServicioTimbreo.obtenerHojaDeRutaActiva();
    $scope.detalleSeleccionado = ServicioTimbreo.obtenerDomicilioActual();
    $scope.hayDetalle = false;

    if($scope.detalleSeleccionado != null) {
    $scope.detalleSeleccionado =
      ($scope.detalleSeleccionado.Tipo_Resultado != undefined && $scope.detalleSeleccionado.Tipo_Resultado != null) ?
      ServicioTimbreo.obtenerSiguienteDomicilioAVisitar() : $scope.detalleSeleccionado;

      $scope.hayDetalle = true;
    }
    $scope.hayDetalle = !($scope.detalleSeleccionado == null);

    ServicioTimbreo.obtenerTiposReclamo({
      beforeSend: function(){
        $ionicLoading.show({
          template: 'Obteniendo Datos'
        });
      },
      success: function(data) {
        if(!data.HasErrors){
          $scope.tiposReclamo = data.Result;
          $scope.$apply();
        } else {

        }
      },
      error: function(result){
        console.log("Error en obtenerTiposReclamo", result);
      },
      then: function(){
        $ionicLoading.hide();
      }
    });
  }

  $scope.init();

  $ionicModal.fromTemplateUrl('templates/timbreos/modalResultado.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.timbreoModal = modal;
  });

  $scope.timbrar = function() {

    if(
      ($scope.timbreo.tipoReclamo1 != undefined && $scope.timbreo.tipoReclamo2 != undefined && $scope.timbreo.tipoReclamo1 == $scope.timbreo.tipoReclamo2) ||
      ($scope.timbreo.tipoReclamo2 != undefined && $scope.timbreo.tipoReclamo3 != undefined && $scope.timbreo.tipoReclamo2 == $scope.timbreo.tipoReclamo3) ||
      ($scope.timbreo.tipoReclamo3 != undefined && $scope.timbreo.tipoReclamo1 != undefined && $scope.timbreo.tipoReclamo3 == $scope.timbreo.tipoReclamo1)
    )
    {
      $ionicPopup.alert({
        title: 'Reclamos Iguales',
        template: "No pueden repetirse los reclamos"
      });

      return;
    }


    ServicioTimbreo.setearTipoRespuesta({
      data: {
        idHojaRutaDetalle: $scope.timbreo.Id_HojaRuta_Detalle,
        codigoTipoResultado: $scope.timbreo.tipoResultado.Codigo,
        idTipoReclamo1: $scope.timbreo.tipoReclamo1 == undefined ? null : $scope.timbreo.tipoReclamo1,
        idTipoReclamo2: $scope.timbreo.tipoReclamo2 == undefined ? null : $scope.timbreo.tipoReclamo2,
        idTipoReclamo3: $scope.timbreo.tipoReclamo3 == undefined ? null : $scope.timbreo.tipoReclamo3
      },
      beforeSend: function(){
        $ionicLoading.show({
          template: "Enviando Respuesta..."
        });
      },
      success: function(hasError, message) {
        if(!hasError) {
          $scope.timbreoModal.hide();
          $scope.detalleSeleccionado = ServicioTimbreo.obtenerSiguienteDomicilioAVisitar();
          $scope.hayDetalle = !($scope.detalleSeleccionado == null);
        }
        else {
          $ionicLoading.hide();
          $ionicPopup.alert({
            title: 'Envío de Respuesta',
            template: message
          });
        }
      },
      then: function(){
        $ionicLoading.hide();
      }
    });
  };

  $scope.irSiguienteDomicilio = function(){
    $scope.detalleSeleccionado = ServicioTimbreo.obtenerSiguienteDomicilioAVisitar();
  }

  $scope.verMapa = function(){
    $state.go("timbreo.mapa");
  }

  function setearTipoRespuesta(Id_HojaRuta_Detalle, Codigo){
    $scope.timbreo = {
      tipoResultado: ServicioTimbreo.obtenerTipoResultadoPorCodigo(Codigo),
      Id_HojaRuta_Detalle: Id_HojaRuta_Detalle
    };


    $scope.mostrarReclamos = true;
    if(Codigo == "NOTIMBREABLE" || Codigo == "NORESPONDE"){
      $scope.mostrarReclamos = false;
    }

    $scope.mostrarReclamo2 = false;
    $scope.mostrarReclamo3 = false;

    $scope.timbreoModal.show();
  }

  $scope.verificarReclamo1 = function(){
    if($scope.timbreo.tipoReclamo1 != undefined){
      $scope.mostrarReclamo2 = true;
    }
    else {
      $scope.timbreo.tipoReclamo2 = undefined;
      $scope.mostrarReclamo2 = false;
    }
  }

  $scope.verificarReclamo2 = function(){
    if($scope.timbreo.tipoReclamo2 != undefined) {
      $scope.mostrarReclamo3 = true;
    }
    else {
      $scope.timbreo.tipoReclamo3 = undefined;
      $scope.mostrarReclamo3 = false;
    }
  }

  $scope.setearPositivo = function() {
    setearTipoRespuesta($scope.detalleSeleccionado.Id_HojaRuta_Detalle, "POSITIVO");
  }

  $scope.setearNegativo = function() {
    setearTipoRespuesta($scope.detalleSeleccionado.Id_HojaRuta_Detalle, "NEGATIVO");
  }

  $scope.setearNoTimbreable = function() {
    setearTipoRespuesta($scope.detalleSeleccionado.Id_HojaRuta_Detalle, "NOTIMBREABLE");
  }

  $scope.setearNoResponde = function() {
    setearTipoRespuesta($scope.detalleSeleccionado.Id_HojaRuta_Detalle, "NORESPONDE");
  }
});
