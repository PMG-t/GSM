import os
import pandas as pd


class XLSXLoader:
    
    def __init__(self, sportello_xlsx_path, guardaroba_xlsx_path):
        self.sportello_xlsx_path = sportello_xlsx_path
        self.guardaroba_xlsx_path = guardaroba_xlsx_path
        self.df_sportello = None
        self.df_guardaroba = None
        self.df_persone = None
    
    def _xlsx2tsv(self, xlsx, sheet, tsv):
        df = pd.read_excel(xlsx, sheet_name=sheet)
        df.to_csv(tsv, sep='\t', index=False)
        if tsv is None:
            raise ValueError("TSV file could not be created from the provided XLSX file.")
        return tsv if os.path.exists(tsv) else None

    def _import_guardaroba(self, xlsx):
        
        tsv = self._xlsx2tsv(xlsx, sheet='ACCESSI', tsv='accessi-guardaroba.tsv')
        df = pd.read_csv(tsv, sep='\t')
        
        df.rename(columns=lambda x: (
            x.strip()
            .lower()
            .replace('.', '')
            .replace(' ', '_')
            .replace('a\'','a')
        ), inplace=True)

        for del_col in [
            '2023',
            '2024',
            '2025',
            '2026',
            * [unc for unc in df.columns if unc.startswith('unnamed:_') ]
        ]:
            if del_col in df.columns:
                del df[del_col]
                
        df.rename(
            columns = {
                k: v
                for k,v in {
                    'data': 'data_inserimento',
                    'cognome': 'cognome',
                    'nome': 'nome',
                    'data_di_nascita': 'data_nascita',
                    'eta': 'eta',
                    'luogo_di_nascita': 'luogo_nascita',
                    'citta': 'citta',
                    'genere': 'genere',
                    'documento': 'documento',
                    'telefono': 'telefono',
                    'stato_civile': 'stato_civile',
                    'figli': 'figli',
                    'condizione_abitativa': 'condizione_abitativa',
                    'categoria_ethos': 'categoria_ethos',
                    'lavoro': 'lavoro',
                    'in_carico_presso': 'in_carico_presso',
                    'istruzione': 'istruzione',
                    'residenza': 'residenza',
                }.items()
                if k in df.columns
            },
            inplace=True
        )
        
        assert df.columns.to_list() == ['data_inserimento', 'cognome', 'nome', 'data_nascita', 'eta',
        'luogo_nascita', 'citta', 'genere', 'documento', 'telefono',
        'stato_civile', 'figli', 'condizione_abitativa', 'lavoro',
        'tipo_di_lavoro', 'in_carico_presso', 'istruzione', 'residenza',
        'sussidio']
        
        return df

    def _import_sportello(self, xlsx):
        
        tsv = self._xlsx2tsv(xlsx, sheet='SPORTELLO HR ACCESSI', tsv='accessi-sportello.tsv')
        df = pd.read_csv(tsv, sep='\t')
        
        df.rename(columns=lambda x: (
            x.strip()
            .lower()
            .replace('.', '')
            .replace(' ', '_')
            .replace('a\'','a')
        ), inplace=True)

        for del_col in [
            '2023',
            '2024',
            '2025',
            '2026',
            'trovato_lavoro?',
            'chiesto_posto_letto?',
            'richiesta_residenza_tramite_cs',
            * [unc for unc in df.columns if unc.startswith('unnamed:_') ]
        ]:
            if del_col in df.columns:
                del df[del_col]
                
        df.rename(
            columns = {
                k: v
                for k,v in {
                    'data': 'data_inserimento',
                    'cognome': 'cognome',
                    'nome': 'nome',
                    'data_di_nascita': 'data_nascita',
                    'eta': 'eta',
                    'nazionalita': 'luogo_nascita',
                    'citta': 'citta',
                    'genere': 'genere',
                    'documento': 'documento',
                    'telefono': 'telefono',
                    'stato_civile': 'stato_civile',
                    'figli': 'figli',
                    'condizione_abitativa': 'condizione_abitativa',
                    'categoria_ethos': 'categoria_ethos',
                    'lavoro': 'lavoro',
                    'in_carico_presso': 'in_carico_presso',
                    'istruzione': 'istruzione',
                    'residenza': 'residenza',
                    'servizi_sociali_e/o_enti_del_terzo_settore_coinvolti_nella_progettualità': 'servizi_sociali',
                    'equipe_marginalità': 'equipe_marginalita',
                    'front_office': 'front_office',
                    'assessment_ed_orientamento': 'assessment_orientamento',
                    'presa_in_carico_e_case_management': 'presa_in_carico_case_management',
                    'consulenza_amm._legale': 'consulenza_amm_legale',
                    'accompagnamento_delle_persone_senza_dimora_per_la_richiesta_di_residenza_fittizia': 'accompagnamento_residenza_fittizia',
                    'servizi_per_l\'igiene_personale': 'servizi_igiene_personale',
                    'distribuzione_beni_essenziali': 'distribuzione_beni_essenziali',
                    'orientamento_al_lavoro': 'orientamento_lavoro',
                    'accoglienza_notturna': 'accoglienza_notturna',
                    'servizi_di_mediazione_linguistico-culturale': 'servizi_mediazione_linguistico_culturale',
                    'corsi_di_lingua_italiana_per_stranieri': 'corsi_lingua_italiana'
                    }.items()
                if k in df.columns
            },
            inplace=True
        )
        
        assert df.columns.to_list() == ['data_inserimento', 'cognome', 'nome', 'data_nascita', 'eta',
        'luogo_nascita', 'citta', 'genere', 'documento', 'telefono',
        'stato_civile', 'figli', 'condizione_abitativa', 'categoria_ethos',
        'lavoro', 'in_carico_presso', 'istruzione', 'residenza',
        'servizi_sociali', 'equipe_marginalita', 'front_office',
        'assessment_orientamento', 'presa_in_carico_case_management',
        'consulenza_amm_legale', 'accompagnamento_residenza_fittizia',
        'servizi_igiene_personale', 'distribuzione_beni_essenziali',
        'orientamento_lavoro', 'accoglienza_notturna',
        'servizi_mediazione_linguistico_culturale', 'corsi_lingua_italiana']

        return df

    def _merge_persone(self, df_sportello, df_guardaroba):
        
        df_sportello.dropna(subset=['nome', 'cognome'], inplace=True)
        df_sportello['nome_cognome'] = df_sportello['nome'] + '_' + df_sportello['cognome']
        df_sportello.drop_duplicates(subset=['nome_cognome'], keep='last', inplace=True)
        df_sportello.reset_index(drop=True, inplace=True)
        df_sportello['sportello'] = True

        df_guardaroba.dropna(subset=['nome', 'cognome'], inplace=True)
        df_guardaroba['nome_cognome'] = df_guardaroba['nome'] + '_' + df_guardaroba['cognome']
        df_guardaroba.drop_duplicates(subset=['nome_cognome'], keep='last', inplace=True)
        df_guardaroba.reset_index(drop=True, inplace=True)
        df_guardaroba['guardaroba'] = True

        df = df_sportello.merge(df_guardaroba, on='nome_cognome', how='outer', suffixes=(None, '_gs'))
        
        gscols = [c for c in df.columns if c.endswith('_gs')]
        for idx,persona in df.iterrows():
            for gsc in gscols:
                hrc = gsc.rstrip('_gs')
                if pd.isnull(df.at[idx, hrc]) and not pd.isnull(df.at[idx, gsc]):
                    df.at[idx, hrc] = df.at[idx, gsc]          
        for gsc in gscols:
            del df[gsc]
        del df['nome_cognome']
        
        assert df.columns.to_list() == ['data_inserimento', 'cognome', 'nome', 'data_nascita', 'eta',
        'luogo_nascita', 'citta', 'genere', 'documento', 'telefono',
        'stato_civile', 'figli', 'condizione_abitativa', 'categoria_ethos',
        'lavoro', 'in_carico_presso', 'istruzione', 'residenza',
        'servizi_sociali', 'equipe_marginalita', 'front_office',
        'assessment_orientamento', 'presa_in_carico_case_management',
        'consulenza_amm_legale', 'accompagnamento_residenza_fittizia',
        'servizi_igiene_personale', 'distribuzione_beni_essenziali',
        'orientamento_lavoro', 'accoglienza_notturna',
        'servizi_mediazione_linguistico_culturale', 'corsi_lingua_italiana',
        'sportello', 'tipo_di_lavoro', 'sussidio', 'guardaroba']
            
        return df
    
    def load_persone(self):
        # dfhr = self.import_sportello('../migrator_test_data/ACCESSI_SPORTELLO.xlsx')
        # dfgs = self.import_guardaroba('../migrator_test_data/ACCESSI_GUARDAROBA.xlsx')
        self.df_sportello = self._import_sportello(self.sportello_xlsx_path)
        self.df_guardaroba = self._import_guardaroba(self.guardaroba_xlsx_path)
        self.df_persone = self._merge_persone(self.df_sportello, self.df_guardaroba)
        
        return self.df_persone