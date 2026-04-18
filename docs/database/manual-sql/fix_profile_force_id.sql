DO $$
DECLARE
    -- ID exato do usuário da imagem
    v_target_user_id uuid := 'e2b8062a-707c-4e3a-ab93-ba53588c61b4'; 
    v_profile_exists boolean;
BEGIN
    -- 1. Verifica se o perfil já existe para esse ID
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE auth_user_id = v_target_user_id) INTO v_profile_exists;

    IF v_profile_exists THEN
        -- Atualiza se já existir para garantir role 'owner'
        UPDATE public.profiles 
        SET role = 'owner', 
            name = 'Vanderlei da Silva',
            email = 'vandersilvasg@hotmail.com'
        WHERE auth_user_id = v_target_user_id;
        
        RAISE NOTICE 'Perfil existente atualizado para owner.';
    ELSE
        -- Cria o perfil se não existir
        INSERT INTO public.profiles (
            id,
            auth_user_id,
            name,
            email,
            role,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            v_target_user_id,
            'Vanderlei da Silva',
            'vandersilvasg@hotmail.com',
            'owner',
            NOW(),
            NOW()
        );
        RAISE NOTICE 'Perfil criado com sucesso!';
    END IF;

    -- 2. Garante que as permissões RLS permitem a leitura
    -- Remove política antiga se existir para evitar conflitos
    DROP POLICY IF EXISTS "Profiles visíveis para usuários autenticados" ON public.profiles;
    DROP POLICY IF EXISTS "Profiles visíveis para todos (Debug)" ON public.profiles;

    -- Cria uma política permissiva para leitura (qualquer usuário autenticado vê tudo)
    CREATE POLICY "Profiles visíveis para todos (Debug)"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);
    
    RAISE NOTICE 'Políticas de RLS atualizadas para permitir leitura.';
END $$;
