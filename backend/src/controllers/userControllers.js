import Role from '../models/Role.js';
import User from '../models/User.js';

export const getAllUsers=async(req,res)=>{
    try{
         const users = await User.find({ isDeleted: false }).populate('roleId');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUserById=async(req,res)=>{
    try{
        const user=await User.findById(req.params.id).populate('roleId');
        if(!user || user.isDeleted){
            return res.status(404).json({message:"User not found"});
        }
        res.status(200).json(user);
    }
    catch(error){
        res.status(500).json({message:error.message});
    }
};

export const updateUser=async(req,res)=>{
    try{
        const { username, email, phone, address, isActive } = req.body;
    
        const user=await User.findByIdAndUpdate(req.params.id,{
            username,email,phone,address,isActive},{new:true}
        ).populate('roleId');
        res.status(200).json({message:"User Updated Successfully",user});
    }
    catch(error){
        res.status(500).json({message:error.message});
    }
};
export const deleteUser=async(req,res)=>{
    try{
        const user=await User.findByIdAndUpdate(req.params.id,{
           isDeleted:true},{new:true}
        ).populate('roleId');
        res.status(200).json({message:"User Deleted Successfully",user});
    }
    catch(error){
        res.status(500).json({message:error.message});
    }
};
// export { getAllUsers, getUserById, updateUser, deleteUser };