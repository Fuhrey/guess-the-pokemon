import csv
import json

def safe_float(value, default=0.0):
    try:
        return float(value) if value.strip() else default
    except (ValueError, AttributeError):
        return default

def safe_int(value, default=0):
    try:
        return int(value) if value.strip() else default
    except (ValueError, AttributeError):
        return default

def convert_csv_to_js():
    pokemon_list = []
    
    with open('pokemon.csv', 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            # Convert string representations to proper data types
            pokemon = {
                "abilities": eval(row['abilities']) if row['abilities'] else [],
                "against_bug": safe_float(row['against_bug']),
                "against_dark": safe_float(row['against_dark']),
                "against_dragon": safe_float(row['against_dragon']),
                "against_electric": safe_float(row['against_electric']),
                "against_fairy": safe_float(row['against_fairy']),
                "against_fight": safe_float(row['against_fight']),
                "against_fire": safe_float(row['against_fire']),
                "against_flying": safe_float(row['against_flying']),
                "against_ghost": safe_float(row['against_ghost']),
                "against_grass": safe_float(row['against_grass']),
                "against_ground": safe_float(row['against_ground']),
                "against_ice": safe_float(row['against_ice']),
                "against_normal": safe_float(row['against_normal']),
                "against_poison": safe_float(row['against_poison']),
                "against_psychic": safe_float(row['against_psychic']),
                "against_rock": safe_float(row['against_rock']),
                "against_steel": safe_float(row['against_steel']),
                "against_water": safe_float(row['against_water']),
                "attack": safe_int(row['attack']),
                "base_egg_steps": safe_int(row['base_egg_steps']),
                "base_happiness": safe_int(row['base_happiness']),
                "base_total": safe_int(row['base_total']),
                "capture_rate": safe_int(row['capture_rate']),
                "classfication": row['classfication'] or "",
                "defense": safe_int(row['defense']),
                "experience_growth": safe_int(row['experience_growth']),
                "height_m": safe_float(row['height_m']),
                "hp": safe_int(row['hp']),
                "japanese_name": row['japanese_name'] or "",
                "name": row['name'] or "",
                "percentage_male": safe_float(row['percentage_male']),
                "pokedex_number": safe_int(row['pokedex_number']),
                "sp_attack": safe_int(row['sp_attack']),
                "sp_defense": safe_int(row['sp_defense']),
                "speed": safe_int(row['speed']),
                "type1": row['type1'] or "",
                "type2": row['type2'] or "",
                "weight_kg": safe_float(row['weight_kg']),
                "generation": safe_int(row['generation']),
                "is_legendary": bool(safe_int(row['is_legendary']))
            }
            pokemon_list.append(pokemon)

    # Create the JavaScript file content
    js_content = "// Pokémon data converted from CSV\nwindow.pokemonData = "
    js_content += json.dumps(pokemon_list, indent=4, ensure_ascii=False)
    js_content += ";\n\n// Add more Pokémon data as needed "

    # Write to JavaScript file with UTF-8 encoding
    with open('pokemon-data.js', 'w', encoding='utf-8') as jsfile:
        jsfile.write(js_content)

if __name__ == "__main__":
    convert_csv_to_js()