window.onload = () => {
  if ($("#error").text() != "##err##") {
    $("#error").show();
  } else {
    $("#error").hide();
  }

  $("#enviar").click(comprobarPass);

}

function comprobarPass() {
  let pass = $("#password");
  let repass = $("#repassword");
  let nombre = $("#nombre");
  let usuario = $("#usuario");

  if(nombre.val() == ""){
    nombre.css("border", "2px solid red");
  }

  if(usuario.val() == ""){
    usuario.css("border", "2px solid red");
  }

  if(pass.val() == ""){
    pass.css("border", "2px solid red");
  }

  if(repass.val() == ""){
    repass.css("border", "2px solid red");
  }

  if(pass.val() != repass.val()){
    pass.css("border", "2px solid red");
    repass.css("border", "2px solid red");
  }
}