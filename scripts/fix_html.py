with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update Value Proposition
old_prop = 'Your personalized, gamified study space designed to adapt to your style and help you conquer your goals.'
new_prop = 'AuraStudy transforms your focus. Lock in, build unbreakable streaks, and crush your goals with a workspace that adapts to your aesthetic.'
html = html.replace(old_prop, new_prop)

# 2. Update CTA button text
old_cta = 'Get Started <i data-lucide=\"arrow-right\"></i>'
new_cta = 'Create My Study Space <i data-lucide=\"arrow-right\"></i>'
html = html.replace(old_cta, new_cta)

# 3. Update Task Logging Clarity
old_placeholder = 'placeholder="Add a study task..."'
new_placeholder = 'placeholder="What do you need to focus on right now? (e.g. Read Chapter 5)"'
html = html.replace(old_placeholder, new_placeholder)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('HTML Updated')
