# Guía: Atlas + SonarQube + GitHub

## 1. Probar que el proyecto funciona
```bash
# Todo con Docker
docker compose up -d --build
# Frontend: http://localhost:3350   Backend: http://localhost:4450/docs
# Usuarios de prueba: admin/admin  y  editor/editor
```
Sin Docker (necesitas PostgreSQL con el dump `BACKEND/sql/dump-atlas.sql` cargado y `BACKEND/.env`):
```bash
cd BACKEND  && npm ci && npm start
cd FRONTEND && npm ci && npm run dev
```

## 2. Levantar SonarQube y analizar
```bash
docker compose -f docker-compose.sonarqube.yml up -d     # http://localhost:9000 (admin/admin)
```
1. En SonarQube: *Create project > Manually* con key `atlas-caso-a` y genera un **token**.
2. Genera la cobertura del backend:
   ```bash
   cd BACKEND && npm ci && npm test && cd ..
   ```
3. Ejecuta el scanner desde la raíz (sin instalar nada):
   ```bash
   docker run --rm --network host -v "$(pwd):/usr/src" \
     -e SONAR_HOST_URL=http://localhost:9000 -e SONAR_TOKEN=TU_TOKEN \
     sonarsource/sonar-scanner-cli
   ```
   (En Windows/Mac reemplaza `localhost` por `host.docker.internal` en SONAR_HOST_URL y quita `--network host`.)
4. Revisa Issues, Security Hotspots y Coverage en el panel.

## 3. Subir a GitHub
```bash
git init
git add .
git commit -m "Proyecto Atlas con SonarQube y pruebas"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```
El workflow `.github/workflows/ci.yml` corre tests, lint y build en cada push.
Para activar Sonar en Actions: variable de repo `USE_SONAR=true` y secrets `SONAR_TOKEN` y `SONAR_HOST_URL`
(el SonarQube local no es accesible desde GitHub; usa SonarCloud si quieres eso).

## Nota
El backend es **intencionalmente vulnerable** (contraseñas en texto plano, JWT por defecto, latencia de 4 s en login, etc.).
No se corrigió para que SonarQube y tus pruebas encuentren hallazgos reales para la actividad.
