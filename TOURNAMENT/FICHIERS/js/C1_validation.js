// validation.js

window.onload = function() {
    // Récupérer le formulaire et le champ de numéro de téléphone
    var form = document.querySelector('form');
    var numeroTelephoneInput = document.getElementById('numero_telephone');

    // Ajouter un écouteur d'événement sur la soumission du formulaire
    form.addEventListener('submit', function(event) {
        // Récupérer la valeur du champ de numéro de téléphone
        var numeroTelephone = numeroTelephoneInput.value;

        // Valider le numéro de téléphone
        if (numeroTelephone.length < 10 || !numeroTelephone.startsWith('0') && !numeroTelephone.startsWith('+')) {
            // Empêcher la soumission du formulaire si la validation échoue
            event.preventDefault();
            alert('Veuillez saisir un numéro de téléphone valide.');
        }
    });
    
};

function toggleOptionalFields() {
            var optionalFields = document.querySelector('.optional-fields');
            var toggleButton = document.querySelector('.toggle-button');
            if (optionalFields.style.display === 'none') {
                optionalFields.style.display = 'block';
                toggleButton.innerHTML = '&#9650;'; // Flèche vers le haut
            } else {
                optionalFields.style.display = 'none';
                toggleButton.innerHTML = '&#9660;'; // Flèche vers le bas
            }
        };
