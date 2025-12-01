import type { CategoriaPCGInterface } from "@/Interfaces/Chat/ProductPCGInterface"
import '@/Styles/Chat/DetailPanel/CategoryRow.css'
import Tooltip from '@mui/material/Tooltip';
import noimageavailable from '@/assets/noimageavailable.webp'

interface Props{
    cat?: CategoriaPCGInterface;
    setselectedCategory: (codGrupo: string | null) => void;
}
export const CategoryTab = ({
    cat,
    setselectedCategory
}: Props) => {
  return (
    // <div className="category-card">
        <div className="category-row" onClick={()=> setselectedCategory(cat?.codGrupo ?? null)}>
            <div className="category-row__image">
                <img src={cat?.imagen ?? noimageavailable} 
                // alt="category image"
                aria-label="category mage" 
                className="category-image"/>
            </div>
            {/* Si el contenido es muy grande se muestra el tooltip */}
            <span className="category-row__label">
                <Tooltip title={cat?.grupo} children={
                <span>
                    {cat?.grupo ?? ""}
                </span>
                } />
            </span>
        </div>
    // </div>
  )
}
