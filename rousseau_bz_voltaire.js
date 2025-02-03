// ==UserScript==
// @name         vovo_script
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  corrige les phrases sur le projet voltaire (accessible depuis le terminal)
// @author       yg.paph
// @match        https://www.projet-voltaire.fr/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let previousSentence = ''; // Variable pour stocker la dernière phrase trouvée

    // Fonction pour récupérer et vérifier la phrase
    function checkPhrase() {
        // Sélectionne le conteneur de la phrase
        const sentenceDiv = document.querySelector('.sentence');

        if (sentenceDiv) {
            // Sélectionner tous les span à l'intérieur de la phrase
            const spans = sentenceDiv.querySelectorAll('.pointAndClickSpan');
            let sentence = '';

            // Concaténer chaque span
            spans.forEach(span => {
                sentence += span.textContent;
            });

            // Supprimer les espaces supplémentaires et comparer avec la précédente
            sentence = sentence.trim();

            // Si la phrase a changé, on la vérifie
            if (sentence !== previousSentence) {
                previousSentence = sentence; // Met à jour la phrase précédente

                // Appel à l'API LanguageTool
                fetch('https://api.languagetool.org/v2/check', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `text=${encodeURIComponent(sentence)}&language=fr`
                })
                .then(response => response.json())
                .then(data => {
                    if (data.matches && data.matches.length > 0) {
                        console.log('Erreurs détectées :');
                        data.matches.forEach(match => {
                            const errorWord = sentence.substring(match.offset, match.offset + match.length);
                            console.log(`- Mot incorrect : "${errorWord}" - ${match.message}`);
                        });
                    } else {
                        console.log('La phrase n\'a pas de faute.');
                    }
                })
                .catch(error => {
                    console.error('Erreur lors de la vérification :', error);
                });
            }
        } else {
            console.log("Le conteneur de la phrase n'a pas été trouvé.");
        }
    }

    // Boucle qui vérifie la phrase toutes les secondes
    setInterval(checkPhrase, 1000);

})();
