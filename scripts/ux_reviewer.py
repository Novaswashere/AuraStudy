import re
import os
import sys

def calculate_contrast(color1, color2):
    def luminance(hex_color):
        if not hex_color or not hex_color.startswith('#'):
            return 1.0 # default to white if unparseable
        hex_color = hex_color.lstrip('#')
        if len(hex_color) == 3:
            hex_color = ''.join([c*2 for c in hex_color])
        
        rgb = tuple(int(hex_color[i:i+2], 16)/255.0 for i in (0, 2, 4))
        
        val = []
        for c in rgb:
            if c <= 0.03928:
                val.append(c / 12.92)
            else:
                val.append(((c + 0.055) / 1.055) ** 2.4)
        
        return val[0] * 0.2126 + val[1] * 0.7152 + val[2] * 0.0722

    l1 = luminance(color1)
    l2 = luminance(color2)
    
    if l1 > l2:
        return (l1 + 0.05) / (l2 + 0.05)
    else:
        return (l2 + 0.05) / (l1 + 0.05)

def analyze_ui_ux():
    html_file = 'index.html'
    css_file = 'style.css'
    
    print("🤖 AI UX/UI Agent Starting Review...\n")
    
    if not os.path.exists(html_file) or not os.path.exists(css_file):
        print("Could not find index.html or style.css.")
        return

    with open(html_file, 'r', encoding='utf-8') as f:
        html_content = f.read()

    with open(css_file, 'r', encoding='utf-8') as f:
        css_content = f.read()

    ui_score = 100
    ux_score = 100
    findings = []

    # 1. CTA Contrast Check
    # We'll test the Cozy aesthetic's primary color as an example
    primary_color_match = re.search(r'--primary:\s*(#[0-9a-fA-F]{3,6})', css_content)
    primary_color = primary_color_match.group(1) if primary_color_match else '#8fa89b'
    
    # Check if btn-primary has a specific color explicitly overriding white
    btn_text_color_match = re.search(r'\.btn-primary\s*{\s*background-color:\s*var\(--primary\);\s*color:\s*(#[0-9a-fA-F]{3,6});', css_content)
    btn_text_color = btn_text_color_match.group(1) if btn_text_color_match else '#ffffff'
    
    contrast = calculate_contrast(primary_color, btn_text_color)
    if contrast < 4.5:
        ui_score -= 20
        findings.append(f"❌ Primary CTA contrast ratio is ~{contrast:.1f}:1, below WCAG 4.5:1 minimum. (Background: {primary_color}, Text: {btn_text_color})")
    else:
        findings.append(f"✅ Primary CTA contrast is good ({contrast:.1f}:1).")

    # 2. Focus States Check (Accessibility)
    if ':focus-visible' in css_content or 'outline: 2px' in css_content:
        findings.append("✅ Interactive elements have defined focus states.")
    else:
        ux_score -= 25
        findings.append("❌ Missing visible focus states for interactive elements (Accessibility High Risk).")

    # 3. Typography Hierarchy
    if re.search(r'h[1-3]\s*{[^}]*font-weight:\s*(700|800|900|bold)', css_content):
        findings.append("✅ Heading typography has strong prominence.")
    else:
        ui_score -= 10
        findings.append("⚠️ Headings could be more prominent (increase font-weight or size).")

    # 4. Spacing Consistency
    if '--spacing-' in css_content:
        findings.append("✅ Consistent spacing variables used in CSS.")
    else:
        ui_score -= 15
        findings.append("❌ Inconsistent spacing detected. Consider using a unified spacing system (e.g. var(--spacing-md)).")

    overall_score = int((ui_score + ux_score) / 2)
    
    print("-" * 40)
    print("📊 AI REVIEW RESULTS")
    print("-" * 40)
    print(f"UI Score: {ui_score}/100")
    print(f"UX Score: {ux_score}/100")
    print(f"Overall Score: {overall_score}/100\n")
    
    print("Prioritized Fix List:")
    for finding in findings:
        print(finding)
        
    print("\nEnd of Report.")

if __name__ == '__main__':
    analyze_ui_ux()
