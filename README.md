# Nexus Arena

Un duel tactique en temps réel, original et jouable en solo dans le navigateur. Déployez votre escouade, gérez votre élixir et détruisez le noyau d’ORA-7 avant qu’il ne détruise le vôtre.

## Lancer le jeu

**Prérequis : Node.js 18 ou plus récent.** Aucune installation de dépendances n’est nécessaire.

```bash
npm start
```

Ouvrez ensuite **http://localhost:8000**.

Autres options :

```bash
# Démarrage direct
node server.mjs

# Autre port
node server.mjs --port=8080

# Alternative sans Node, avec Python
python -m http.server 8000
```

Le jeu fonctionne avec les versions récentes de Chromium, Firefox et Safari, sur ordinateur et sur écran tactile.

## Comment jouer

- Cliquez sur une carte puis sur votre territoire, ou glissez-la directement dans l’arène.
- Les touches **1 à 4** sélectionnent les cartes de votre main.
- **P** met le jeu en pause, **M** active ou coupe le son, **Échap** annule la sélection ou met en pause.
- Chaque carte coûte de l’élixir, qui se recharge automatiquement. Après chaque déploiement, la carte suivante du deck entre dans votre main.
- Les unités terrestres utilisent les ponts ; l’Aéron survole la rivière. Les sorts Comète et Pulse peuvent cibler toute l’arène.
- Détruire un relais adverse élargit votre zone de déploiement sur cette voie et active le noyau ennemi.
- La destruction du noyau donne une victoire immédiate. Sinon, le camp ayant détruit le plus de tours gagne à la fin des **3 minutes**.
- La dernière minute est en **double élixir**. En cas d’égalité, une **mort subite de 60 secondes** a lieu : la prochaine tour gagne. Si l’égalité persiste, l’intégrité restante des tours départage les camps.

## Les huit cartes

| Carte | Coût | Rôle |
| --- | ---: | --- |
| Gardien | 3 | Combattant polyvalent au corps à corps |
| Essaim | 2 | Trois unités terrestres rapides |
| Volt | 4 | Tir à distance, capable de toucher les cibles volantes |
| Aéron | 3 | Unité volante à distance |
| Atlas | 5 | Colosse très résistant qui cible les structures |
| Comète | 4 | Frappe de zone à dégâts élevés |
| Bastion | 4 | Tourelle défensive temporaire de 30 secondes |
| Pulse | 2 | Dégâts de zone et ralentissement |

Trois protocoles d’IA sont disponibles : **Recrue**, **Standard** et **Expert**. L’adversaire possède le même élixir et le même deck que le joueur ; il défend les menaces, choisit des contres, constitue des assauts et utilise ses sorts tactiquement.

## Choix techniques

- **HTML, CSS et JavaScript ES modules**, sans framework ni dépendance externe.
- **Canvas 2D** pour l’arène, les unités, l’eau, les projectiles et les particules.
- Simulation à pas fixe de **60 Hz**, indépendante de la fréquence d’affichage.
- **Web Audio API** pour les sons synthétisés en temps réel.
- Serveur statique minimal avec les modules natifs de Node.js.
- Interface responsive, contrôles souris, clavier et tactiles.

Tous les noms, visuels vectoriels et sons sont originaux et générés par le code. Aucun asset, nom ou son de Supercell n’est utilisé. Aucun compte, service réseau ou téléchargement d’asset n’est requis.

## Structure

```text
index.html          Interface et écrans de jeu
styles.css          Design responsive
js/cards.js         Arène, statistiques et visuels SVG des cartes
js/game.js          Combat, deck, élixir, règles et IA
js/renderer.js      Rendu Canvas et effets visuels
js/audio.js         Sons procéduraux
js/main.js          Contrôles, HUD et boucle principale
server.mjs          Serveur local
```

Le projet a été vérifié dans Chromium sur des formats ordinateur et mobile, avec des simulations complètes de partie et des parcours réels de déploiement, pause, mort subite, victoire, défaite et revanche.
