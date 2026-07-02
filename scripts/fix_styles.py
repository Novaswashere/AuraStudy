import re

with open('style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# 1. Add Spacing Variables to :root
css = css.replace(':root {\n    --transition-speed:', ':root {\n    --spacing-xs: 4px;\n    --spacing-sm: 8px;\n    --spacing-md: 16px;\n    --spacing-lg: 24px;\n    --spacing-xl: 32px;\n    --transition-speed:')

# 2. Add Focus states for accessibility
focus_rule = '''
/* Global Focus States for Accessibility */
a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
}
'''
css = css + focus_rule

# 3. Increase Heading Prominence
css = re.sub(r'(h1, h2, h3, h4, h5, h6 \{\s*font-family: var\(--font-heading\);)\s*font-weight: 700;', r'\g<1>\n    font-weight: 800;', css)

# 4. Button Contrast and Uniformity
# Darken primary color for cozy aesthetic to #4a6858
css = css.replace('--primary: #8fa89b;', '--primary: #4a6858;')
# And for watercolour to #4a5c9a
css = css.replace('--primary: #9aa8e3;', '--primary: #4a5c9a;')

anime_btn_override = '''
body[data-theme="anime"] .btn-primary {
    color: #2b2b2b;
}
body[data-theme="anime"] .btn-primary:hover {
    color: #2b2b2b;
}
'''
css = css.replace('.btn-primary {', anime_btn_override + '\n.btn-primary {')

# 5. Mobile Responsiveness: Make primary buttons full width on small screens
mobile_btn_fix = '''
@media (max-width: 600px) {
    .btn {
        width: 100%;
        margin-bottom: var(--spacing-sm);
    }
}
'''
css = css + mobile_btn_fix

# Replace arbitrary margins with variables
css = css.replace('padding: 20px;', 'padding: var(--spacing-lg);')
css = css.replace('gap: 20px;', 'gap: var(--spacing-lg);')
css = css.replace('gap: 10px;', 'gap: var(--spacing-sm);')

with open('style.css', 'w', encoding='utf-8') as f:
    f.write(css)

print('CSS Updated')
