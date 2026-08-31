# Tacheron Tonnage 📱

Application Android de calcul du tonnage d'équipe.

## Compilation 100 % depuis un téléphone

Le dossier `.github/workflows/build-apk.yml` est déjà configuré.

1. Crée un compte GitHub si nécessaire.
2. Crée un nouveau dépôt, par exemple `TacheronTonnage`.
3. Depuis le navigateur du téléphone, ouvre le dépôt et utilise **Add file → Upload files**.
4. Envoie le contenu de ce ZIP (en conservant les dossiers `.github/workflows`).
5. Une fois le dépôt envoyé, ouvre **Actions**.
6. Sélectionne **Build APK** puis **Run workflow**.
7. Quand le workflow est terminé avec une coche verte, ouvre l'exécution.
8. Dans **Artifacts**, télécharge `Tacheron-Tonnage-APK`.
9. Décompresse l'archive téléchargée et installe `app-debug.apk`.

GitHub Actions exécute la compilation sur un runner hébergé : aucun PC n'est nécessaire.

## Calcul
Part individuelle = tonnage total × coefficient individuel / somme des coefficients.

Exemple : 5 personnes à 100/100/100/80/100 %. Les 20 % retirés sont automatiquement redistribués aux autres via la normalisation des coefficients.

Prix par défaut : 0,02390 €/kg.
