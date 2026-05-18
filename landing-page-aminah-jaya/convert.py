import re

with open('src/routes/example.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract CSS
style_match = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
css = style_match.group(1) if style_match else ""

# Scope CSS
css = css.replace(':root', '.waiteu-page')
css = css.replace('body {', '.waiteu-page {')
css = css.replace('* {', '.waiteu-page * {')
css = css.replace('html {', '/* html {')
css = css.replace('scroll-behavior: smooth;\n        }', 'scroll-behavior: smooth;\n        } */')

with open('src/routes/waiteu.css', 'w', encoding='utf-8') as f:
    f.write(css)

# Extract Body
body_match = re.search(r'<body>(.*?)<script>', content, re.DOTALL)
body_html = body_match.group(1) if body_match else ""

# Convert self-closing tags
body_html = re.sub(r'<img([^>]*?)(?<!/)>', r'<img\1 />', body_html)
body_html = re.sub(r'<br([^>]*?)(?<!/)>', r'<br\1 />', body_html)
body_html = re.sub(r'<hr([^>]*?)(?<!/)>', r'<hr\1 />', body_html)
body_html = re.sub(r'<input([^>]*?)(?<!/)>', r'<input\1 />', body_html)
body_html = re.sub(r'<meta([^>]*?)(?<!/)>', r'<meta\1 />', body_html)
body_html = re.sub(r'<link([^>]*?)(?<!/)>', r'<link\1 />', body_html)

# Fix inline styles (Solid JS supports string styles, but let's just make sure it's valid JSX)
# Actually, JSX style="string" is perfectly valid in SolidJS!
# One thing: JSX comments
body_html = body_html.replace('<!--', '{/*').replace('-->', '*/}')

# We need to wrap it in a Solid component
tsx_content = f"""import {{ onMount }} from "solid-js";
import {{ Title, Link }} from "@solidjs/meta";
import "./waiteu.css";

export default function Waiteu() {{
  onMount(() => {{
    // Scroll reveal
    const reveals = document.querySelectorAll('.waiteu-page .reveal');
    const observer = new IntersectionObserver((entries) => {{
        entries.forEach((entry, i) => {{
            if (entry.isIntersecting) {{
                setTimeout(() => entry.target.classList.add('visible'), i * 80);
                observer.unobserve(entry.target);
            }}
        }});
    }}, {{ threshold: 0.1 }});
    reveals.forEach(el => observer.observe(el));

    // Stagger children of grids
    document.querySelectorAll('.waiteu-page .pain-grid, .waiteu-page .benefits-grid, .waiteu-page .awards-grid, .waiteu-page .reasons-list').forEach(grid => {{
        [...grid.children].forEach((child: any, i) => {{
            child.style.transitionDelay = `${{i * 0.08}}s`;
            child.classList.add('reveal');
            observer.observe(child);
        }});
    }});
  }});

  return (
    <div class="waiteu-page">
      <Title>Laili WAITEU – Whitening Injection in One Drink</Title>
      <Link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&display=swap"
          rel="stylesheet"
      />
      {{/* Content Start */}}
      {body_html}
      {{/* Content End */}}
    </div>
  );
}}
"""

with open('src/routes/waiteu.tsx', 'w', encoding='utf-8') as f:
    f.write(tsx_content)

print("Conversion complete!")
