import os
content = open(r'D:\APProject\x\z\js\expense.js', 'r', encoding='utf-8-sig').read()
content = content.replace("#FFD93D", "#FFB347")
content = content.replace("#FFB4A7", "#D2917E")
content = content.replace("#C9B1FF", "#B8A0D0")
content = content.replace("#7BC8A4", "#89C9A99")
content = content.replace("#AAAAAA", "#B0B0B0")
open(r'D:\APproject\x\z\js\expense.js', 'w', encoding='utf-8').write(content)
print('done')