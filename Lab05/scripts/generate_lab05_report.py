"""Generate Node_Lab05.docx from Node_Lab04.docx template (headers preserved, lab number patched)."""
from __future__ import annotations

import uuid
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / "Node_Lab04.docx"
OUTPUT = ROOT / "Node_Lab05.docx"

W14_NS = "http://schemas.microsoft.com/office/word/2010/wordml"
W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
HEADER_FILES = ("word/header1.xml", "word/header2.xml")


def esc(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def para_id() -> str:
    return uuid.uuid4().hex[:8].upper()


def p_text(text: str, style: str | None = "ZIKSMAINTEXT", center: bool = False) -> str:
    pid = para_id()
    ppr = "<w:pPr>"
    if center:
        ppr += '<w:jc w:val="center"/>'
    if style:
        ppr += f'<w:pStyle w:val="{style}"/>'
    ppr += "</w:pPr>"
    runs = ""
    if text:
        runs = f'<w:r><w:t xml:space="preserve">{esc(text)}</w:t></w:r>'
    return (
        f'<w:p w14:paraId="{pid}" w14:textId="77777777" '
        f'w:rsidR="00A1B2C4" w:rsidRDefault="00A1B2C4">'
        f"{ppr}{runs}</w:p>"
    )


def p_title_lines() -> str:
    subtitle = "Docker: контейнеризація Express REST API та Docker Compose"
    return (
        '<w:p w14:paraId="426EF51E" w14:textId="463C5626" w:rsidR="00485AE5" '
        'w:rsidRDefault="00000000"><w:pPr><w:jc w:val="center"/></w:pPr>'
        '<w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>ЛАБОРАТОРН</w:t></w:r>'
        '<w:r w:rsidR="00C37858"><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>А</w:t></w:r>'
        '<w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t xml:space="preserve"> РОБОТ</w:t></w:r>'
        '<w:r w:rsidR="00C37858"><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>А</w:t></w:r>'
        '<w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t xml:space="preserve"> № 5</w:t></w:r></w:p>'
        f'<w:p w14:paraId="{para_id()}" w14:textId="77777777" w:rsidR="00485AE5" '
        f'w:rsidRDefault="00000000"><w:pPr><w:jc w:val="center"/></w:pPr>'
        f'<w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>{esc(subtitle)}</w:t></w:r></w:p>'
    )


def p_meta_goal() -> str:
    goal = (
        "Мета: набути практичних навичок контейнеризації Node.js-застосунку з Docker: "
        "multi-stage Dockerfile, .dockerignore, оркестрація Express + MongoDB через Docker Compose "
        "з volumes та healthcheck для моніторингу стану сервісів."
    )
    return (
        f'<w:p w14:paraId="{para_id()}" w14:textId="77777777" w:rsidR="00485AE5" '
        f'w:rsidRPr="00C37858" w:rsidRDefault="00000000">'
        f'<w:pPr><w:pStyle w:val="Textlab"/><w:rPr><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:pPr>'
        f'<w:r w:rsidRPr="00C37858"><w:rPr><w:b/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr>'
        f'<w:t xml:space="preserve">Мета: </w:t></w:r>'
        f'<w:r w:rsidRPr="00C37858"><w:rPr><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr>'
        f"<w:t>{esc(goal[5:])}</w:t></w:r></w:p>"
    )


def p_figure(num: int, caption: str) -> str:
    return p_text(f"Рис. {num}. ({caption})", style="ZIKSMAINTEXT")


def p_code_lines(lines: list[str]) -> str:
    return "".join(p_text(line, style="ZIKSMAINTEXT") for line in lines)


def read_code(rel: str, max_lines: int | None = None) -> list[str]:
    path = ROOT / rel
    text = path.read_text(encoding="utf-8").splitlines()
    if max_lines:
        text = text[:max_lines]
    return text


def build_body() -> str:
    blocks: list[str] = []

    def add(*items: str) -> None:
        blocks.extend(items)

    add(p_title_lines(), p_meta_goal(), p_text("Хід роботи:"))

    add(
        p_text("Завдання 1. Встановлення Docker"),
        p_text(
            "Встановлено Docker Desktop. Перевірено версії CLI та Compose, "
            "запущено тестовий контейнер hello-world для підтвердження роботи демона та доступу до Docker Hub."
        ),
        p_text("Команди перевірки:"),
        p_text("docker --version"),
        p_text("docker compose version"),
        p_text("docker run hello-world"),
        p_figure(1, "Термінал — вивід docker --version та docker compose version"),
        p_figure(2, "Термінал — повідомлення Hello from Docker! після docker run hello-world"),
    )

    add(
        p_text("Завдання 2. Dockerfile, .dockerignore та локальний запуск"),
        p_text(
            "Створено .dockerignore для виключення node_modules, dist, coverage, .env, тестів, "
            "скриптів звіту та файлів Docker з контексту збірки. "
            "Dockerfile реалізує multi-stage збірку: стадія builder (node:24) — npm ci та tsc; "
            "стадія production — лише production-залежності та dist з builder. "
            "Документовано порт EXPOSE 3000, процес запускається від USER node, CMD — node dist/src/server.js. "
            "Порядок інструкцій оптимізовано для кешування: спочатку package.json і package-lock.json, "
            "потім npm ci, далі вихідний код."
        ),
        p_text("Лістинг .dockerignore:"),
        p_code_lines(read_code(".dockerignore")),
        p_text("Лістинг Dockerfile:"),
        p_code_lines(read_code("Dockerfile")),
        p_text("Збірка та запуск з MongoDB Atlas (файл .env на хості):"),
        p_text("docker build -t myapp ."),
        p_text("docker run -p 3000:3000 --env-file .env myapp"),
        p_figure(3, "Термінал — успішна збірка образу docker build -t myapp ."),
        p_figure(4, "Термінал — логи контейнера: підключення до MongoDB та http://localhost:3000"),
        p_figure(5, "curl — відповідь GET /api/movies (CRUD API працює в контейнері)"),
        p_text("Перевірка управління контейнерами: docker ps, docker logs, docker stop, docker rm."),
        p_figure(6, "Термінал — docker ps (запущений контейнер myapp)"),
    )

    add(
        p_text("Завдання 3. Docker Compose"),
        p_text(
            "Створено compose.yaml з сервісами mongo (образ mongo:8, root-користувач, база mydb, "
            "volume mongo-data) та app (build: ., порт 3000:3000, MONGODB_URI на mongo, depends_on). "
            "Запуск стеку: docker compose up --build. Перевірено збереження даних після "
            "docker compose down та повторного docker compose up."
        ),
        p_text("Лістинг compose.yaml:"),
        p_code_lines(read_code("compose.yaml")),
        p_text("Команди:"),
        p_text("docker compose up --build"),
        p_text("docker compose ps"),
        p_text("docker compose logs -f app"),
        p_text("docker compose down"),
        p_text("docker compose down -v"),
        p_figure(7, "Термінал — docker compose up --build, обидва сервіси Started"),
        p_figure(8, "docker compose ps — сервіси app та mongo у стані running"),
        p_figure(9, "POST /api/movies через curl — створення запису в локальній MongoDB"),
        p_figure(10, "Після docker compose down і повторного up — запис залишився (GET /api/movies)"),
    )

    add(
        p_text("Завдання 4. Healthcheck-ендпоінт"),
        p_text(
            "Додано GET /health у app.ts перед усіма middleware та маршрутами. "
            "Ендпоінт перевіряє mongoose.connection.readyState: 200 і status ok при підключенні, "
            "503 — якщо БД недоступна. У compose.yaml налаштовано healthcheck для app (fetch /health) "
            "та mongo (mongosh ping), depends_on app очікує service_healthy для mongo."
        ),
        p_text("Лістинг src/app.ts (фрагмент /health):"),
        p_code_lines(read_code("src/app.ts", 22)),
        p_figure(11, "curl http://localhost:3000/health — JSON зі status ok та database.connected"),
        p_figure(12, "docker compose ps — обидва сервіси зі статусом (healthy)"),
    )

    add(
        p_text("Посилання на репозиторій GitLab — [вказати URL після завантаження]"),
        p_text(
            "Висновок: REST API з лабораторної роботи №4 розгорнуто в Docker-контейнері з multi-stage "
            "збіркою; Docker Compose піднімає Express і MongoDB однією командою, дані зберігаються у volume, "
            "стан сервісів контролюється через healthcheck. Проєкт готовий до здачі."
        ),
    )

    return "".join(blocks)


def patch_header_xml(data: bytes) -> bytes:
    """Update lab number 4 → 5 in header/footer kolontytuls."""
    root = ET.fromstring(data)
    text_nodes = list(root.iter(f"{{{W_NS}}}t"))

    for index, node in enumerate(text_nodes):
        if (node.text or "") == "4" and index > 0:
            prev = text_nodes[index - 1]
            prev_text = (prev.text or "") + (prev.tail or "")
            if "Лр" in prev_text or prev_text.strip() in ("Лр", "–", " "):
                node.text = "5"

    xml_body = ET.tostring(root, encoding="unicode")
    return ("<?xml version='1.0' encoding='UTF-8' standalone='yes'?>\n" + xml_body).encode("utf-8")


def replace_document_body(template_xml: bytes, new_body: str) -> bytes:
    doc = template_xml.decode("utf-8")
    body_start = doc.index("<w:body>") + len("<w:body>")
    sect_start = doc.index("<w:sectPr")
    body_end = doc.index("</w:body>")
    if sect_start < body_start or body_end < sect_start:
        raise RuntimeError("Unexpected document.xml structure in template")
    new_doc = doc[:body_start] + new_body + doc[sect_start:body_end] + doc[body_end:]
    return new_doc.encode("utf-8")


def main() -> None:
    if not TEMPLATE.exists():
        raise SystemExit(f"Template not found: {TEMPLATE}")

    new_body = build_body()

    with zipfile.ZipFile(TEMPLATE, "r") as zin:
        template_doc = zin.read("word/document.xml")
        new_doc = replace_document_body(template_doc, new_body)
        ET.fromstring(new_doc)

        with zipfile.ZipFile(OUTPUT, "w", compression=zipfile.ZIP_DEFLATED) as zout:
            for info in zin.infolist():
                if info.filename == "word/document.xml":
                    data = new_doc
                elif info.filename in HEADER_FILES:
                    data = patch_header_xml(zin.read(info.filename))
                else:
                    data = zin.read(info.filename)
                zout.writestr(info, data)

    print(f"Created: {OUTPUT}")


if __name__ == "__main__":
    main()
