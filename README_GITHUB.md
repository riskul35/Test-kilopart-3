# Tacheron Tonnage — compilation depuis téléphone

Le dossier `.github/workflows/build-apk.yml` permet à GitHub Actions de compiler automatiquement l'APK dans le cloud.

## Depuis un téléphone

1. Créer un dépôt GitHub vide.
2. Envoyer tout le contenu de ce ZIP dans le dépôt (y compris `.github/workflows/build-apk.yml`).
3. Ouvrir l'onglet **Actions**.
4. Sélectionner **Build Android APK**.
5. Appuyer sur **Run workflow**.
6. Une fois terminé, ouvrir l'exécution réussie et télécharger l'artefact **Tacheron-Tonnage-APK**.
7. Extraire l'APK et l'installer sur Android.

Le workflow compile un APK debug installable pour les tests.
