"""Generate Node_Lab04.docx from Node_Lab03.docx template (headers unchanged)."""
from __future__ import annotations

import re
import uuid
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / "Node_Lab03.docx"
OUTPUT = ROOT / "Node_Lab04.docx"
SRC = ROOT / "src"

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
W14_NS = "http://schemas.microsoft.com/office/word/2010/wordml"


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
        ppr += "<w:jc w:val=\"center\"/>"
    if style:
        ppr += f"<w:pStyle w:val=\"{style}\"/>"
    ppr += "</w:pPr>"
    runs = ""
    if text:
        runs = (
            f"<w:r><w:t xml:space=\"preserve\">{esc(text)}</w:t></w:r>"
        )
    return (
        f'<w:p w14:paraId="{pid}" w14:textId="77777777" '
        f'w:rsidR="00A1B2C4" w:rsidRDefault="00A1B2C4">'
        f"{ppr}{runs}</w:p>"
    )


def p_title_lines() -> str:
    subtitle = "MongoDB, Mongoose та інтеграційне тестування REST API"
    return (
        '<w:p w14:paraId="426EF51E" w14:textId="463C5626" w:rsidR="00485AE5" '
        'w:rsidRDefault="00000000"><w:pPr><w:jc w:val="center"/></w:pPr>'
        '<w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>ЛАБОРАТОРН</w:t></w:r>'
        '<w:r w:rsidR="00C37858"><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>А</w:t></w:r>'
        '<w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t xml:space="preserve"> РОБОТ</w:t></w:r>'
        '<w:r w:rsidR="00C37858"><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>А</w:t></w:r>'
        '<w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t xml:space="preserve"> № 4</w:t></w:r></w:p>'
        f'<w:p w14:paraId="{para_id()}" w14:textId="77777777" w:rsidR="00485AE5" '
        f'w:rsidRDefault="00000000"><w:pPr><w:jc w:val="center"/></w:pPr>'
        f'<w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>{esc(subtitle)}</w:t></w:r></w:p>'
    )


def p_meta_goal() -> str:
    goal = (
        "Мета: інтегрувати Express.js API з MongoDB Atlas за допомогою Mongoose, "
        "зберегти HTTP-валідацію через Zod, реалізувати фільтрацію, сортування, "
        "пагінацію, обробку помилок MongoDB та переписати тести на mongodb-memory-server."
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

    # --- Task 3.1 ---
    add(
        p_text("Завдання 1. MongoDB Atlas та MongoDB Compass"),
        p_text(
            "Створено обліковий запис на cloud.mongodb.com, розгорнуто безкоштовний кластер M0. "
            "У Network Access додано IP 0.0.0.0/0 (для розробки). Створено користувача БД DDXwild. "
            "Встановлено MongoDB Compass і підключенося до кластера ddxwild.lg6bktk.mongodb.net."
        ),
        p_figure(1, "MongoDB Atlas — безкоштовний кластер M0"),
        p_figure(2, "Network Access — дозвіл підключення з IP 0.0.0.0/0"),
        p_figure(3, "Database Users — користувач DDXwild (SCRAM)"),
        p_figure(4, "MongoDB Compass — успішне підключення до кластера"),
        p_text(
            "У Compass створено базу даних mydb та колекцію movies (сутність Movie з лаб. 3). "
            "Вручну додано кілька документів із полями title, releaseYear, genre, director."
        ),
        p_figure(5, "MongoDB Compass — база mydb, колекція movies з документами"),
        p_text(
            "У корені проєкту Lab04 створено файл .env із MONGODB_URI та PORT=3000. "
            "Файл .env додано до .gitignore; створено .env.example із шаблоном без реальних паролів."
        ),
        p_figure(6, "Файли .env (локально) та .env.example у проєкті"),
    )

    # --- Task 3.2 ---
    add(
        p_text("Завдання 2. Підключення Mongoose та оновлення server.ts"),
        p_text(
            "Встановлено mongoose та dotenv. Створено src/config/database.ts з connectDatabase() "
            "та disconnectDatabase(); зареєстровано обробники error і disconnected. "
            "server.ts спочатку підключається до БД, потім запускає HTTP-сервер; при помилці — exit(1). "
            "Реалізовано graceful shutdown за SIGTERM."
        ),
        p_text("Лістинг src/config/database.ts:"),
        p_code_lines(read_code("src/config/database.ts")),
        p_text("Лістинг src/server.ts (фрагмент bootstrap):"),
        p_code_lines(read_code("src/server.ts", 48)),
        p_figure(7, "Запуск npm run dev — підключення до MongoDB та http://localhost:3000"),
    )

    # --- Task 3.3 ---
    add(
        p_text("Завдання 3. Mongoose-схема та модель"),
        p_text(
            "Створено src/models/entity.model.ts: інтерфейс Movie, схема з timestamps: true, "
            "обмеження полів узгоджено з Zod. Кастомний валідатор title (наявність літери). "
            "Віртуальне поле displayTitle; toJSON/toObject з virtuals та мапінгом _id → id."
        ),
        p_text("Лістинг src/models/entity.model.ts (фрагмент):"),
        p_code_lines(read_code("src/models/entity.model.ts", 55)),
        p_text("Zod-схеми в src/schemas/entity.schema.ts залишено для HTTP-валідації."),
        p_text("Лістинг src/schemas/entity.schema.ts (listQuerySchema):"),
        p_code_lines(read_code("src/schemas/entity.schema.ts", 46)),
    )

    # --- Task 3.4 ---
    add(
        p_text("Завдання 4. Заміна сховища на Mongoose"),
        p_text(
            "Модуль src/storage/entity.ts переписано на MovieModel: findAll, getById, create, update, "
            "remove, getRecent. Ідентифікатори генерує MongoDB (ObjectId). "
            "findByIdAndUpdate використовує returnDocument: 'after' та runValidators: true. "
            "Функцію reset видалено."
        ),
        p_text("Лістинг src/storage/entity.ts (фрагмент):"),
        p_code_lines(read_code("src/storage/entity.ts", 65)),
    )

    # --- Task 3.5 ---
    add(
        p_text("Завдання 5. Обробка помилок MongoDB"),
        p_text(
            "Розширено errorHandler: ZodError → 400; CastError → 400 (невалідний id); "
            "ValidationError → 400; MongoServerError code 11000 → 409; інше → 500. "
            "Валідний ObjectId без документа повертає 404 у маршрутах."
        ),
        p_text("Лістинг src/middleware/errorHandler.ts:"),
        p_code_lines(read_code("src/middleware/errorHandler.ts")),
        p_figure(8, "Відповідь API 400 для невалідного формату ObjectId"),
        p_figure(9, "Відповідь API 404 для валідного ObjectId без документа"),
    )

    # --- Task 3.6 ---
    add(
        p_text("Завдання 6. Фільтрація, сортування та пагінація"),
        p_text(
            "Фільтри genre, minYear, maxYear, title реалізовано через Mongoose Query API "
            "(оператори $gte/$lte, RegExp з екрануванням). Сортування: параметр sort, "
            "префікс «-» для спадання (наприклад -releaseYear). Пагінація: page (за замовч. 1), "
            "limit (за замовч. 10, max 100); countDocuments і find виконуються паралельно."
        ),
        p_text(
            "GET /api/movies повертає { data, pagination }. Збережено GET /api/movies/recent."
        ),
        p_figure(10, "GET /api/movies — відповідь з data та pagination"),
        p_figure(11, "Фільтрація та сортування (genre, minYear, sort)"),
        p_text("Приклади запитів:"),
        p_text("npm run dev"),
        p_text(
            'curl -X POST http://localhost:3000/api/movies -H "Content-Type: application/json" '
            '-d "{\\"title\\":\\"Inception\\",\\"releaseYear\\":2010,\\"genre\\":\\"sci-fi\\",'
            '\\"director\\":\\"Christopher Nolan\\"}"'
        ),
        p_text("curl \"http://localhost:3000/api/movies?genre=sci-fi&minYear=2000&sort=-releaseYear&page=1&limit=10\""),
        p_text("curl http://localhost:3000/api/movies/recent"),
        p_figure(12, "POST /api/movies — статус 201 Created"),
    )

    # --- Task 3.7 ---
    add(
        p_text("Завдання 7. Тестування з mongodb-memory-server"),
        p_text(
            "Встановлено mongodb-memory-server (dev). tests/setup.ts: connectTestDb, "
            "disconnectTestDb, clearMovieCollection. У tests/entity.test.ts — beforeAll/afterAll, "
            "beforeEach очищення колекції; unit-тести моделі та інтеграційні тести API."
        ),
        p_text("Лістинг tests/setup.ts:"),
        p_code_lines(read_code("tests/setup.ts")),
        p_text("Результат: npm test — 45 тестів пройдено (2 test suites)."),
        p_figure(13, "Термінал — успішне виконання npm test"),
        p_figure(14, "Звіт покриття npm run test:coverage (за потреби)"),
    )

    add(
        p_text("Посилання на репозиторій GitLab — [вказати URL після завантаження]"),
        p_text(
            "Висновок: реалізовано REST API фільмів з персистентним зберіганням у MongoDB Atlas "
            "через Mongoose, двошаровою валідацією (Zod + Mongoose), фільтрацією, сортуванням, "
            "пагінацією, обробкою специфічних помилок MongoDB та 45 автоматизованими тестами. "
            "Проєкт готовий до здачі."
        ),
    )

    return "".join(blocks)


def replace_document_body(template_xml: bytes, new_body: str) -> bytes:
    """Keep original <w:document> root (all namespaces) and <w:sectPr> from template."""
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
                data = new_doc if info.filename == "word/document.xml" else zin.read(info.filename)
                zout.writestr(info, data)

    print(f"Created: {OUTPUT}")


if __name__ == "__main__":
    main()
