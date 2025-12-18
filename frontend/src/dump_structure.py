import os

output_file = "project_structure.txt"

def dump_directory(root_dir, output_file):
    with open(output_file, "w", encoding="utf-8") as out:
        for foldername, subfolders, filenames in os.walk(root_dir):
            # относительный путь
            rel_path = os.path.relpath(foldername, root_dir)
            if rel_path == ".":
                rel_path = ""
            out.write(f"\n📂 Папка: {rel_path or './'}\n")

            for filename in filenames:
                filepath = os.path.join(foldername, filename)
                out.write(f"\n📄 Файл: {os.path.join(rel_path, filename)}\n")
                out.write("=" * 60 + "\n")
                try:
                    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                    out.write(content + "\n")
                except Exception as e:
                    out.write(f"[Ошибка чтения файла: {e}]\n")
                out.write("=" * 60 + "\n")
    print(f"✅ Структура проекта сохранена в {output_file}")

if __name__ == "__main__":
    dump_directory(os.getcwd(), output_file)
